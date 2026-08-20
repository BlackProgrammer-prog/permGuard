import ts from "typescript";

export interface ImportedBinding {
  readonly moduleName: string;
  readonly importedName: string;
}

export type ImportBindings = ReadonlyMap<ts.Symbol, ImportedBinding>;

export function collectImportBindings(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ImportBindings {
  const bindings = new Map<ts.Symbol, ImportedBinding>();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }

    for (const element of statement.importClause.namedBindings.elements) {
      if (element.isTypeOnly || statement.importClause.isTypeOnly) {
        continue;
      }

      const symbol = checker.getSymbolAtLocation(element.name);

      if (symbol) {
        bindings.set(symbol, {
          moduleName: statement.moduleSpecifier.text,
          importedName: (element.propertyName ?? element.name).text,
        });
      }
    }
  }

  return bindings;
}

export function isImportedIdentifier(
  node: ts.Node,
  checker: ts.TypeChecker,
  bindings: ImportBindings,
  moduleName: string,
  importedName: string,
): node is ts.Identifier {
  if (!ts.isIdentifier(node)) {
    return false;
  }

  const symbol = checker.getSymbolAtLocation(node);
  const binding = symbol ? bindings.get(symbol) : undefined;

  return (
    binding?.moduleName === moduleName && binding.importedName === importedName
  );
}

export function isCaslAbilityMethod(
  node: ts.PropertyAccessExpression,
  checker: ts.TypeChecker,
): boolean {
  const symbol = checker
    .getTypeAtLocation(node.expression)
    .getProperty(node.name.text);

  return (
    symbol?.declarations?.some((declaration) => {
      const fileName = declaration
        .getSourceFile()
        .fileName.replaceAll("\\", "/");

      return (
        fileName.includes("/node_modules/@casl/ability/") ||
        fileName.includes("/node_modules/.pnpm/@casl+ability@")
      );
    }) ?? false
  );
}
