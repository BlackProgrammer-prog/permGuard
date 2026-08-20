import { Can } from "@permguard/react";

export function ProductCard() {
  return (
    <Can action="remove" subject="Product">
      Remove
    </Can>
  );
}
