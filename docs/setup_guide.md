# Setup Guide

## Prerequisites

Ensure you have the following tools installed:

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0.0
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Kubectl](https://kubernetes.io/docs/tasks/tools/) compatible with your cluster version

## Getting Started

1. **Clone the repository:**

   ```sh
   git clone <repository-url>
   cd terraform-eks
   ```

2. **Configure AWS Credentials:**

   ```sh
   aws configure
   ```

3. **Initialize Terraform:**

   ```sh
   cd udemy
   terraform init
   ```

4. **Plan and Apply:**
   ```sh
   terraform apply
   ```
