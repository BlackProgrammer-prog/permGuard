export default function ProductPage() {
  async function updateProduct() {
    "use server";
    await Promise.resolve();
  }

  const saveDraft = async () => {
    "use server";
    await Promise.resolve();
  };

  async function ordinaryAsyncFunction() {
    await Promise.resolve();
  }

  void [updateProduct, saveDraft, ordinaryAsyncFunction];

  return null;
}
