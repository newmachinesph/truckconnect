import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  governmentId: f({ image: { maxFileSize: "4MB", maxFileCount: 2 } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  ltfrbCertificate: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  vehicleOrCr: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  truckPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  cargoPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  epodPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  bolDocument: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  loadAttachment: f({
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  insuranceCertificate: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
