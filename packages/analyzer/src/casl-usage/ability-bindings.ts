import ts from "typescript";
import { isImportedIdentifier, type ImportBindings } from "./imports.js";

const CASL_MODULE = "@casl/ability";

export function collectBuiltAbilityBindings(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  imports: ImportBindings,
): ReadonlySet<ts.Symbol> {
  const buildBindings = new Set<ts.Symbol>();
  const abilityBindings = new Set<ts.Symbol>();

  function collectBuilders(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      ts.isNewExpression(node.initializer) &&
      isImportedIdentifier(
        node.initializer.expression,
        checker,
        imports,
        CASL_MODULE,
        "AbilityBuilder",
      )
    ) {
      for (const element of node.name.elements) {
        const propertyName = element.propertyName ?? element.name;

        if (
          ts.isIdentifier(propertyName) &&
          propertyName.text === "build" &&
          ts.isIdentifier(element.name)
        ) {
          const symbol = checker.getSymbolAtLocation(element.name);
          if (symbol) buildBindings.add(symbol);
        }
      }
    }

    ts.forEachChild(node, collectBuilders);
  }

  function collectAbilities(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression)
    ) {
      const factorySymbol = checker.getSymbolAtLocation(
        node.initializer.expression,
      );

      if (factorySymbol && buildBindings.has(factorySymbol)) {
        const abilitySymbol = checker.getSymbolAtLocation(node.name);
        if (abilitySymbol) abilityBindings.add(abilitySymbol);
      }
    }

    ts.forEachChild(node, collectAbilities);
  }

  collectBuilders(sourceFile);
  collectAbilities(sourceFile);
  return abilityBindings;
}
