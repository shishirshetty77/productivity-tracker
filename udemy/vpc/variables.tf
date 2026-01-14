variable "vpc_cidr" {
  description = "The IPv4 CIDR block for the VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of Availability Zones to distribute subnets across"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets (no direct internet access)"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets (internet accessible)"
  type        = list(string)
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}
