terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.1"
    }
  }

  # Optional: Remote state storage
  # Uncomment and configure when you're ready to use remote state
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "financial-platform/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-lock-table"
  # }
}
