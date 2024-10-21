// az login

// RESOURCE_GROUP="AetherQHeaderQuartersResourceMainEntry"
// NAMESPACE_NAME="aetheriqservicebus"
// QUEUE_NAME="servicebusqueue"
// LOCATION="eastus"  # You can change this to your preferred location

// az servicebus namespace create --resource-group $RESOURCE_GROUP --name $NAMESPACE_NAME --location $LOCATION

// az servicebus queue create --resource-group $RESOURCE_GROUP --namespace-name $NAMESPACE_NAME --name $QUEUE_NAME

// CONNECTION_STRING=$(az servicebus namespace authorization-rule keys list --resource-group $RESOURCE_GROUP --namespace-name $NAMESPACE_NAME --name RootManageSharedAccessKey --query primaryConnectionString --output tsv)

// export AZURE_SERVICE_BUS_CONNECTION_STRING=$CONNECTION_STRING
