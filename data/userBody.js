export const createUserBody = () => {
  const email = `${Date.now()}@qa.com.br`;
  return {
    nome: "Demo Test",
    email: email,
    password: "testing",
    administrador: "true",
  };
};