export const getFilter = (contract, event_name) => {
 switch (event_name) {
    case "OrderPlaced":
       return contract.filters.OrderPlaced();
    case "OrderCanceled":
        return contract.filters.OrderCanceled();
    case "AssetRemoved":
        return contract.filters.AssetRemoved();
    case "AssetAdded":
        return contract.filters.AssetAdded();
    case "Trade":
        return contract.filters.Trade();
    case "Deposit":
        return contract.filters.Deposit();
    default:
        return contract.filters.OrderPlaced();
       
       
 }
}

