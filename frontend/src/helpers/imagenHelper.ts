
export const convertirImagenABase64 = (
  file: File
): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(file.type)) {
      reject(
        new Error("⚠️ Solo se permiten imágenes JPG, PNG o WebP")
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(
        new Error("⚠️ La imagen no puede exceder 5MB")
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("Error al leer la imagen"));
    };
    reader.readAsDataURL(file);
  });
};


export const puedeSubirImagenes = (
  esAdmin: boolean,
  esSupervisor: boolean
): boolean => {
  return esAdmin || esSupervisor;
};
