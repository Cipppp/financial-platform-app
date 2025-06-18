# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.tags, {
      Environment = var.environment
      AccountId   = var.target_account_id
    })
  }
}

# Data source to get current account information
data "aws_caller_identity" "current" {}

# Data source to get current region
data "aws_region" "current" {}

# Verify we're deploying to the correct account
resource "null_resource" "account_verification" {
  provisioner "local-exec" {
    command = <<-EOT
      if [ "${data.aws_caller_identity.current.account_id}" != "${var.target_account_id}" ]; then
        echo "❌ ERROR: Deploying to wrong account!"
        echo "Expected: ${var.target_account_id}"
        echo "Actual: ${data.aws_caller_identity.current.account_id}"
        exit 1
      fi
      echo "✅ Deploying to correct account: ${data.aws_caller_identity.current.account_id}"
      echo "📍 Region: ${data.aws_region.current.name}"
      echo "🏷️  Environment: ${var.environment}"
    EOT
  }

  triggers = {
    account_id  = data.aws_caller_identity.current.account_id
    region      = data.aws_region.current.name
    environment = var.environment
  }
}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4

  keepers = {
    environment = var.environment
    project     = var.project_name
  }
}

# KMS Key for encryption
resource "aws_kms_key" "financial_platform" {
  description             = "KMS key for ${var.project_name} ${var.environment} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-${var.environment}-kms-key"
  }
}

resource "aws_kms_alias" "financial_platform" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.financial_platform.key_id
}

# DynamoDB Tables
module "dynamodb" {
  source = "./modules/dynamodb"

  environment                   = var.environment
  project_name                  = var.project_name
  billing_mode                  = var.dynamodb_billing_mode
  random_suffix                 = random_id.suffix.hex
  kms_key_id                    = var.enable_server_side_encryption ? aws_kms_key.financial_platform.arn : null
  enable_point_in_time_recovery = var.enable_point_in_time_recovery

  depends_on = [null_resource.account_verification]
}

# S3 Buckets for static assets and backups
module "s3" {
  source = "./modules/s3"

  environment   = var.environment
  project_name  = var.project_name
  random_suffix = random_id.suffix.hex
  kms_key_id    = aws_kms_key.financial_platform.arn

  depends_on = [null_resource.account_verification]
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"

  environment  = var.environment
  project_name = var.project_name
  account_id   = data.aws_caller_identity.current.account_id

  dynamodb_table_arns = module.dynamodb.table_arns
  s3_bucket_arns      = module.s3.bucket_arns
  kms_key_arn         = aws_kms_key.financial_platform.arn

  depends_on = [null_resource.account_verification]
}

# CloudFront Distribution (optional)
module "cloudfront" {
  count  = var.enable_cloudfront ? 1 : 0
  source = "./modules/cloudfront"

  environment      = var.environment
  project_name     = var.project_name
  domain_name      = var.domain_name
  s3_bucket_domain = module.s3.website_bucket_domain

  depends_on = [null_resource.account_verification]
}

# Cost Budget Alert
resource "aws_budgets_budget" "financial_platform" {
  count = var.notification_email != "" ? 1 : 0

  name         = "${var.project_name}-${var.environment}-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.cost_alert_threshold)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filters = {
    Tag = ["Project:${var.project_name}", "Environment:${var.environment}"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.notification_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.notification_email]
  }
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  kms_key_id        = var.enable_server_side_encryption ? aws_kms_key.financial_platform.arn : null

  tags = {
    Name = "${var.project_name}-${var.environment}-logs"
  }
}
