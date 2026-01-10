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

- `udemy/`: Contains the main Terraform configuration.
- `udemy/vpc`: VPC module.
- `udemy/eks`: EKS module.

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
