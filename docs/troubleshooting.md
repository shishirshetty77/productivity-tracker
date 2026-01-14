# Troubleshooting

## Common Issues

### 1. Terraform Init Fails

- Check internet connection.
- Verify AWS credentials are correct.

### 2. VPC Limit Exceeded

- Check if you have reached the maximum number of VPCs in the region.
- Request a quota increase if necessary.

### 3. EKS Cluster Creation Timeout

- Ensure subnets have internet access (NAT Gateway for private subnets).
- Check security group rules.
