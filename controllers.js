const get = require('lodash/get');
module.exports = (prisma) => {
  const c = {}
  
  c.agrianGetRequest = async (requestURI) => {
    let data = await (await fetch(requestURI, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Authorization": `API-KEY ${process.env.AGRIAN_API_KEY}`,
        "Content-Type": "application/json; charset=UTF-8"
      }
    })).json()
    return data
  }
  
  c.agrianFetch = (endpoint, topLevelKey) => async ({ attrs, limit = -1 }) => {
    const requestURI = `${process.env.AGRIAN_HOST}${endpoint}`

    let data = await c.agrianGetRequest(requestURI)
    let arr = []
    while (data.meta.page < data.meta.page_count) {
      data = await c.agrianGetRequest(`${requestURI}?page=${data.meta.page + 1}`)
      let pageData = get(data, topLevelKey, [])
      for (const page of pageData) {
        arr.push(page)
      }
    }
    if (Array.isArray(attrs) && attrs.length > 0) {
      for (let i = 0; i < arr.length; i++) {
        let record = {}
        for (const key of attrs) {
          record[key] = get(arr[i], key, null)
        }
        arr[i] = record
      }
    }
    return (limit > -1) ? arr.slice(0, limit) : arr
  }

  c.createGrower = async (data) => {
    const grower = await prisma.grower.create({
      data
    })

    return grower
  }

  return c
}