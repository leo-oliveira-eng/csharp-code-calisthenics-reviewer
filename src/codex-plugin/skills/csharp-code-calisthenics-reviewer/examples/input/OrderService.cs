using System;
using System.Collections.Generic;
using System.Linq;

namespace Example;

public class OrderService
{
    public void Process(List<Order> orders, decimal discountRate, string customerType)
    {
        if (orders == null)
        {
            throw new ArgumentNullException(nameof(orders));
        }
        else
        {
            foreach (var order in orders)
            {
                if (order.Total > 100)
                {
                    if (customerType == "VIP")
                    {
                        order.Total = order.Total - (order.Total * discountRate);
                    }
                    else
                    {
                        order.Total = order.Total - 5;
                    }
                }
            }

            Save(orders);
            Notify(customerType, orders.Count);
        }
    }

    private void Save(List<Order> orders)
    {
        Console.WriteLine($"Saved {orders.Count} orders.");
    }

    private void Notify(string customerType, int orderCount)
    {
        Console.WriteLine($"Notified {customerType} customer about {orderCount} orders.");
    }
}

public class Order
{
    public decimal Total { get; set; }
}
