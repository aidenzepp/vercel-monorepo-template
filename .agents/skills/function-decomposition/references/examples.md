# Function Decomposition Examples

Use these examples as labeled acceptance data. The text immediately above each snippet states the evidence that determines its label.

Every snippet is a complete excerpt from a module whose referenced types are defined immediately above it. Surrounding types are identical across each comparison and are intentionally omitted. The examples follow the repository's `document-code` contract so decomposition is the only labeled axis.

## Workflow outline

### NEGATIVE — One function implements every stage of a cohesive workflow

**Decisive evidence:** `placeOrder` coordinates the workflow while also implementing input parsing, line validation, catalog lookup, pricing, and aggregation. Calling the overall workflow cohesive does not make those internal rules one responsibility.

```ts
/**
 * Places an order from submitted customer and line-item values.
 *
 * @param input - The untrusted values submitted for the order.
 * @param dependencies - The pricing, persistence, and receipt capabilities.
 * @returns The persisted order after its receipt has been sent.
 * @throws {RangeError} When the submitted values or catalog prices are invalid.
 */
const placeOrder = async (
  input: OrderInput,
  dependencies: OrderDependencies,
): Promise<Order> => {
  const customerId = input.customerId.trim();

  if (customerId.length === 0 || input.lines.length === 0) {
    throw new RangeError("An order requires a customer and at least one line.");
  }

  const lines = input.lines.map(({ quantity, sku }) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new RangeError("Order quantities must be positive integers.");
    }

    const unitPrice = dependencies.prices.get(sku);

    if (unitPrice === undefined) {
      throw new RangeError(`No catalog price exists for ${sku}.`);
    }

    return {
      quantity,
      sku,
      subtotal: quantity * unitPrice,
      unitPrice,
    };
  });

  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const order = await dependencies.orders.save({
    customerId,
    lines,
    total,
  });

  await dependencies.receipts.send(order);

  return order;
};
```

### POSITIVE — The coordinator reads as the workflow outline

**Decisive evidence:** `parseOrderInput` owns order-level normalization and validation, while `priceOrder` owns line validation, catalog pricing, and aggregation. Keeping quantity validation beside each line's catalog lookup preserves the original error order. Both helpers have precise contracts and simpler call sites. `placeOrder` retains the direct persistence and receipt operations because coordinating them is its responsibility.

```ts
/**
 * Normalizes and validates the order-level submitted values.
 *
 * @param input - The untrusted values submitted for the order.
 * @returns An order draft with a normalized customer identifier.
 * @throws {RangeError} When the order lacks a customer or lines.
 */
const parseOrderInput = (input: OrderInput): OrderDraft => {
  const customerId = input.customerId.trim();

  if (customerId.length === 0 || input.lines.length === 0) {
    throw new RangeError("An order requires a customer and at least one line.");
  }

  return { customerId, lines: input.lines };
};

/**
 * Validates and applies catalog prices to every submitted order line.
 *
 * @param draft - The normalized order awaiting prices.
 * @param prices - The catalog price indexed by product identifier.
 * @returns The priced lines and their combined total.
 * @throws {RangeError} When a quantity is invalid or a product has no catalog price.
 */
const priceOrder = (
  draft: OrderDraft,
  prices: ReadonlyMap<string, number>,
): PricedOrder => {
  const lines = draft.lines.map(({ quantity, sku }) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new RangeError("Order quantities must be positive integers.");
    }

    const unitPrice = prices.get(sku);

    if (unitPrice === undefined) {
      throw new RangeError(`No catalog price exists for ${sku}.`);
    }

    return {
      quantity,
      sku,
      subtotal: quantity * unitPrice,
      unitPrice,
    };
  });

  return {
    customerId: draft.customerId,
    lines,
    total: lines.reduce((sum, line) => sum + line.subtotal, 0),
  };
};

/**
 * Coordinates order placement from submitted values through receipt delivery.
 *
 * @param input - The untrusted values submitted for the order.
 * @param dependencies - The pricing, persistence, and receipt capabilities.
 * @returns The persisted order after its receipt has been sent.
 * @throws {RangeError} When the submitted order cannot be parsed or priced.
 */
const placeOrder = async (
  input: OrderInput,
  dependencies: OrderDependencies,
): Promise<Order> => {
  const draft = parseOrderInput(input);
  const pricedOrder = priceOrder(draft, dependencies.prices);
  const order = await dependencies.orders.save(pricedOrder);

  await dependencies.receipts.send(order);

  return order;
};
```

## Transparent expressions

### NEGATIVE — A helper merely renames obvious arithmetic

**Decisive evidence:** `calculateSubtotal` has a precise result but its call site is less direct than `quantity * unitPrice`. It owns no pricing policy, so it fails the simpler-call-site condition.

```ts
/**
 * Multiplies a quantity by its unit price.
 *
 * @param quantity - The number of purchased units.
 * @param unitPrice - The price of one unit.
 * @returns The line subtotal.
 */
const calculateSubtotal = (quantity: number, unitPrice: number): number =>
  quantity * unitPrice;

/**
 * Applies a unit price to one order line.
 *
 * @param line - The product and quantity awaiting a price.
 * @param unitPrice - The catalog price of one product unit.
 * @returns The order line with its unit price and subtotal.
 */
const priceLine = (line: OrderLine, unitPrice: number): PricedLine => ({
  ...line,
  subtotal: calculateSubtotal(line.quantity, unitPrice),
  unitPrice,
});
```

### POSITIVE — Transparent arithmetic remains inside its owning transformation

**Decisive evidence:** `priceLine` owns the coherent transformation from an unpriced line to a priced line. Keeping the multiplication visible makes its implementation clearer than another function call.

```ts
/**
 * Applies a unit price to one order line.
 *
 * @param line - The product and quantity awaiting a price.
 * @param unitPrice - The catalog price of one product unit.
 * @returns The order line with its unit price and subtotal.
 */
const priceLine = (line: OrderLine, unitPrice: number): PricedLine => ({
  ...line,
  subtotal: line.quantity * unitPrice,
  unitPrice,
});
```

## Pass-through operations

### NEGATIVE — Helpers rename capabilities without adding a boundary

**Decisive evidence:** `saveOrder` and `sendOrderReceipt` repeat the names and signatures of existing dependency methods. They add no policy, translation, or control flow, so the coordinator becomes harder to trace without becoming easier to understand.

```ts
/**
 * Delegates an order to its repository.
 *
 * @param repository - The order persistence capability.
 * @param order - The priced order to persist.
 * @returns The persisted order.
 */
const saveOrder = (
  repository: OrderRepository,
  order: PricedOrder,
): Promise<Order> => repository.save(order);

/**
 * Delegates receipt delivery to its existing capability.
 *
 * @param receipts - The receipt delivery capability.
 * @param order - The order acknowledged by the receipt.
 * @returns A promise that resolves after delivery completes.
 */
const sendOrderReceipt = (
  receipts: ReceiptService,
  order: Order,
): Promise<void> => receipts.send(order);

/**
 * Coordinates persistence and receipt delivery for a priced order.
 *
 * @param order - The priced order ready to persist.
 * @param dependencies - The persistence and receipt capabilities.
 * @returns The persisted order after its receipt has been sent.
 */
const placeOrder = async (
  order: PricedOrder,
  dependencies: OrderDependencies,
): Promise<Order> => {
  const savedOrder = await saveOrder(dependencies.orders, order);
  await sendOrderReceipt(dependencies.receipts, savedOrder);
  return savedOrder;
};
```

### POSITIVE — The coordinator keeps direct operations visible

**Decisive evidence:** The repository and receipt calls already express the workflow in domain language. Removing the pass-through helpers shortens the trace without hiding either side effect.

```ts
/**
 * Coordinates persistence and receipt delivery for a priced order.
 *
 * @param order - The priced order ready to persist.
 * @param dependencies - The persistence and receipt capabilities.
 * @returns The persisted order after its receipt has been sent.
 */
const placeOrder = async (
  order: PricedOrder,
  dependencies: OrderDependencies,
): Promise<Order> => {
  const savedOrder = await dependencies.orders.save(order);

  await dependencies.receipts.send(savedOrder);

  return savedOrder;
};
```

## Growing policy

### NEGATIVE — Pricing policy is buried inside persistence orchestration

**Decisive evidence:** Discount selection, tax exemption, jurisdictional fallback, and currency rounding form a coherent pricing policy. Keeping that policy inside `completeCheckout` makes the coordinator implement a separately nameable responsibility.

```ts
/**
 * Prices and persists a checkout using the policy selected for its customer.
 *
 * @param checkout - The checkout awaiting its final charge.
 * @param dependencies - The pricing policy and checkout repository.
 * @returns The persisted checkout with its final charge.
 */
const completeCheckout = (
  checkout: CheckoutDraft,
  dependencies: CheckoutDependencies,
): Promise<Checkout> => {
  const discountRate =
    checkout.customer.tier === "gold"
      ? dependencies.policy.goldDiscountRate
      : dependencies.policy.standardDiscountRate;
  const discountedSubtotal = checkout.subtotal * (1 - discountRate);
  const taxRate = checkout.customer.taxExempt
    ? 0
    : (dependencies.policy.taxRates.get(checkout.customer.state) ??
      dependencies.policy.defaultTaxRate);
  const total = Math.round(discountedSubtotal * (1 + taxRate));

  return dependencies.checkouts.save({ ...checkout, total });
};
```

### POSITIVE — Accumulated policy earns a named function

**Decisive evidence:** `calculateCheckoutTotal` owns the complete pricing decision with explicit inputs and a semantic result. Its name makes the persistence workflow simpler even when it has only one current caller.

```ts
/**
 * Applies discount, jurisdictional tax, and currency-rounding policy.
 *
 * @param subtotal - The pre-discount merchandise total.
 * @param customer - The customer attributes that select pricing policy.
 * @param policy - The discount and tax configuration for the checkout.
 * @returns The final charge rounded to the smallest currency unit.
 */
const calculateCheckoutTotal = (
  subtotal: number,
  customer: CustomerPricing,
  policy: CheckoutPolicy,
): number => {
  const discountRate =
    customer.tier === "gold"
      ? policy.goldDiscountRate
      : policy.standardDiscountRate;
  const discountedSubtotal = subtotal * (1 - discountRate);
  const taxRate = customer.taxExempt
    ? 0
    : (policy.taxRates.get(customer.state) ?? policy.defaultTaxRate);

  return Math.round(discountedSubtotal * (1 + taxRate));
};

/**
 * Persists a checkout using the pricing policy selected for its customer.
 *
 * @param checkout - The checkout awaiting its final charge.
 * @param dependencies - The pricing policy and checkout repository.
 * @returns The persisted checkout with its final charge.
 */
const completeCheckout = (
  checkout: CheckoutDraft,
  dependencies: CheckoutDependencies,
): Promise<Checkout> => {
  const total = calculateCheckoutTotal(
    checkout.subtotal,
    checkout.customer,
    dependencies.policy,
  );

  return dependencies.checkouts.save({ ...checkout, total });
};
```
