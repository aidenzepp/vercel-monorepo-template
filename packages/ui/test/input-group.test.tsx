import { expect, test } from "bun:test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group";
import { renderToStaticMarkup } from "react-dom/server";

test("input groups derive one uniform disabled treatment from their control", () => {
  const markup = renderToStaticMarkup(
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput disabled />
    </InputGroup>
  );

  const group = /<div(?=[^>]*data-slot="input-group")[^>]*>/u.exec(markup)?.[0];
  const input = /<input(?=[^>]*data-slot="input-group-control")[^>]*>/u.exec(
    markup
  )?.[0];

  expect(group).toContain(
    "has-[[data-slot=input-group-control]:disabled]:opacity-50"
  );
  expect(input).toContain("disabled:opacity-100");
  expect(group).not.toContain("data-disabled");
});
