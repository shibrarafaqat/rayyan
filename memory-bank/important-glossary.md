Karigar: Tailor role with permissions to update order status to "stitched".
Muteer: Manager role with permissions to create, update, and manage orders and payments.
Fitoora: Measurement sheet (image) associated with an order.

---

## Centralized Validation Utilities

All validation logic for phone numbers, order forms, and payments is centralized in `utils/helpers.ts`.

### Usage
- Use `validateSaudiPhone(phone)` to check if a phone number is valid for Saudi Arabia.
- Use `validateOrderFields(fields)` to validate all order form fields at once. Returns an object with error messages for each invalid field.
- Use `validatePaymentAmount(amount, remaining)` to validate payment amounts against the order's remaining balance.

This ensures consistent validation across the app and makes future changes easier.
