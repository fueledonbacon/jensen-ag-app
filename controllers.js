module.exports = (prisma) => {
  const c = {}

  c.createGrower = async (data) => {
    const grower = await prisma.grower.create({
      data
    })

    return grower
  }

  return c
}