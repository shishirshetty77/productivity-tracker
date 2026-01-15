# Architecture

## Overview

This project uses Terraform to deploy an Amazon Elastic Kubernetes Service (EKS) cluster. It follows a modular architecture.

## Components

### VPC

The VPC module deploys:

- A Virtual Private Cloud (VPC)
- Public and Private Subnets in multiple Availability Zones
- Internet Gateway and NAT Gateways
- Route Tables

### EKS Cluster

The EKS module deploys:

- EKS Control Plane
- Managed Node Groups
- IAM Roles and Policies
- Security Groups

## Diagram

(Placeholder for architecture diagram)

## Security

- **IAM**: Least privilege access using IAM Roles.
- **Network**: Private subnets for work loads, Public subnets for Load Balancers.
- **Encryption**: Secrets encryption at rest (optional configuration).
