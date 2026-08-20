"use server";

export async function createProduct() {
  await Promise.resolve();
}

export const deleteProduct = async () => {
  await Promise.resolve();
};

async function publish() {
  await Promise.resolve();
}

export { publish as publishProduct };

async function internalHelper() {
  await Promise.resolve();
}

void internalHelper;

export function syncAction() {}

export { importedAction } from "./imported-action";
