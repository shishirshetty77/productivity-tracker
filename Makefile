.PHONY: plan apply init fmt

init:
	cd udemy && terraform init

plan:
	cd udemy && terraform plan

apply:
	cd udemy && terraform apply

fmt:
	terraform fmt -recursive
