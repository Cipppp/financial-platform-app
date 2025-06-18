variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "target_account_id" {
  description = "Target AWS account ID where resources will be deployed"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.target_account_id))
    error_message = "Account ID must be a 12-digit number."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "financial-platform"
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = false
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = false
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "Billing mode must be either PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "enable_point_in_time_recovery" {
  description = "Enable DynamoDB point-in-time recovery"
  type        = bool
  default     = true
}

variable "enable_server_side_encryption" {
  description = "Enable DynamoDB server-side encryption"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project   = "financial-platform"
    ManagedBy = "terraform"
  }
}

variable "cost_alert_threshold" {
  description = "Monthly cost alert threshold in USD"
  type        = number
  default     = 100
}

variable "notification_email" {
  description = "Email for cost and monitoring alerts"
  type        = string
  default     = ""
}
