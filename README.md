# Terraform EKS

## Project Status

Active development.
Project

This project provisions an EKS cluster using Terraform.

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
