export const createProductBody = () => {
  const productName = `Product ${Math.floor(Math.random() * 10)}`;
  return {
    nome: productName,
    preco: 50,
    descricao: "Product description",
    quantidade: 50,
  };
};