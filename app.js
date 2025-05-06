require("dotenv").config()

const url = "https://apiperu.dev/api/ruc"
const token = process.env.API_KEY_SUNAT
const ruc = "20141878477"

const fetchDatosRUC = async () => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ruc }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Datos del RUC desde padrón reducido de SUNAT:")
    console.log(data)
  } catch (error) {
    console.error("Fetch error:", error)
  }
}

fetchDatosRUC()
