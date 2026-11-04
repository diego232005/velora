const FIRST_NAMES = [
  'Ana', 'Luis', 'Maria', 'Carlos', 'Diana', 'Jorge', 'Paola', 'Andres',
  'Camila', 'Felipe', 'Valeria', 'Santiago', 'Natalia', 'Mateo', 'Daniela',
  'Sebastian', 'Laura', 'Nicolas', 'Carolina', 'Esteban',
];

const LAST_NAMES = [
  'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Hernandez', 'Gonzalez',
  'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Diaz', 'Vargas', 'Castro',
  'Moreno', 'Rojas', 'Gutierrez', 'Ortiz', 'Jimenez', 'Ruiz', 'Mendoza',
];

export const CLIENT_HEADERS = [
  'nombres',
  'apellidos',
  'correo',
  'telefono',
  'ciudad',
  'tipo_documento',
  'numero_documento',
  'fecha_nacimiento',
  'contrasena',
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomDigits(length) {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += Math.floor(Math.random() * 10);
  }
  return value;
}

function randomBirthDate() {
  const year = 1970 + Math.floor(Math.random() * 35);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildRandomClients(cities, documentTypes, count = 20) {
  const stamp = Date.now().toString().slice(-8);
  const rows = [];

  for (let index = 1; index <= count; index += 1) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const city = pick(cities);
    const documentType = pick(documentTypes);

    rows.push({
      nombres: firstName,
      apellidos: lastName,
      correo: `${firstName}.${lastName}.${stamp}${index}@correo.com`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
      telefono: `310${randomDigits(7)}`,
      ciudad: city.nombre,
      tipo_documento: documentType.codigo,
      numero_documento: `${stamp}${String(index).padStart(3, '0')}${randomDigits(3)}`,
      fecha_nacimiento: randomBirthDate(),
      contrasena: `Clave${randomDigits(4)}a`,
    });
  }

  return rows;
}
