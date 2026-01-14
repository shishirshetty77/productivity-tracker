# Terraform EKS

## Project Status

Active development.
This project provides a comprehensive Terraform configuration for provisioning an Amazon EKS cluster with VPC and worker nodes.

## Features

- VPC creation
- EKS Cluster provisioning
- Modular Terraform structure

## Structure

- `udemy/`: Root directory containing the main Terraform configuration for the EKS cluster.
- `udemy/vpc`: Terraform module responsible for provisioning the AWS VPC, subnets, and networking components.
- `udemy/eks`: Terraform module for provisioning the EKS cluster, worker nodes, and related IAM roles.

## Prerequisites

- Terraform >= 1.0.0
- AWS CLI configured

## Usage

1. Initialize Terraform:

   ```sh
   terraform init
   ```

2. Plan the deployment:

   ```sh
   terraform plan
   ```

3. Apply:
   ```sh
   terraform apply
   ```

## Support

For issues, please refer to the `docs/troubleshooting.md` guide or open an issue in the repository.
