/**
 * Exercises the structural JSX elements that remain native in application code.
 *
 * @returns The allowed JSX fixture.
 */
const AllowedElements = () => (
  <main>
    <header>
      <nav>
        <a href="/docs">Documentation</a>
      </nav>
    </header>
    <section>
      <article>
        <h1>Allowed elements</h1>
        <p>Structural elements preserve their native semantics.</p>
        <form>
          <div>
            <span>Form content</span>
          </div>
        </form>
        <ul>
          <li>List item</li>
        </ul>
        <svg aria-label="Example" role="img" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </article>
    </section>
    <aside>Related content</aside>
    <Primitives.button />
    <widget:button />
    <footer>Footer</footer>
  </main>
);

export { AllowedElements };
