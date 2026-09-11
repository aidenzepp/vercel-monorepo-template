/**
 * Exercises each native JSX element with a direct application primitive.
 *
 * @returns The forbidden JSX fixture.
 */
const ForbiddenElements = () => (
  <div>
    <button type="button" />
    <input />
    <textarea />
    <select />
    <label />
    <img alt="Example" src="/example.png" />
    <fieldset />
    <legend />
    <option />
    <optgroup />
    <progress max="100" value="50" />
    <hr />
    <kbd />
    <dialog />
    <details />
    <summary />
    <table />
    <thead />
    <tbody />
    <tfoot />
    <tr />
    <th />
    <td />
    <caption />
  </div>
);

export { ForbiddenElements };
