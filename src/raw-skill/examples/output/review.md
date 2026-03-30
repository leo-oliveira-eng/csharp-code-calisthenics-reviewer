# Findings

- Rule: Only one level of indentation per method
  Assessment: Concern
  Evidence: `Process` nests a null check, a `foreach`, an order-total condition, and a customer-type condition. The deepest branch goes well beyond one indentation level.
  Suggestion: Use a guard clause for `orders == null`, then extract the discount decision into a separate method or policy object.

- Rule: Avoid `else`
  Assessment: Concern
  Evidence: `Process` contains an `else` after the null check and another `else` inside the discount logic.
  Suggestion: Replace both branches with guard clauses or early returns so the happy path stays flat.

- Rule: Wrap primitives in value objects when it makes sense
  Assessment: Concern
  Evidence: `discountRate` and `customerType` carry domain meaning but are represented as raw `decimal` and `string`.
  Suggestion: Introduce value objects such as `DiscountRate` and `CustomerType` to make valid states explicit.

- Rule: First-class collections
  Assessment: Concern
  Evidence: `List<Order>` is passed through `Process` and `Save` as a raw collection with behavior spread across the service.
  Suggestion: Introduce an `OrderBatch` or similar collection abstraction to hold iteration and batch-level behavior.

- Rule: Small methods with intention-revealing names
  Assessment: Concern
  Evidence: `Process` validates input, applies pricing rules, persists data, and sends notifications. The name is broad and hides multiple responsibilities.
  Suggestion: Split the work into smaller methods with explicit names such as `ApplyDiscounts`, `SaveBatch`, and `NotifyCustomer`.

# Refactor plan

1. Replace the outer `if/else` with a guard clause so `Process` starts with the valid path.
2. Extract discount selection into a small method or domain object to remove nested conditional logic.
3. Introduce value objects for `CustomerType` and `DiscountRate` to replace raw primitives.
4. Replace raw `List<Order>` parameters with an `OrderBatch` collection abstraction.
5. Split `Process` into smaller methods whose names reveal validation, pricing, persistence, and notification separately.

# Optional snippet

```csharp
if (orders is null)
{
    throw new ArgumentNullException(nameof(orders));
}
```
