variable "cluster_name" {
  description = "Name of the EKS cluster to be created"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster (e.g. 1.25)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "node_groups" {
  description = "EKS node group configuration"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    scaling_config = object({
      desired_size = number
      max_size     = number
      min_size     = number
    })
  }))
}
