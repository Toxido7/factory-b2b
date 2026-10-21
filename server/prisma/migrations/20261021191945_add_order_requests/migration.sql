-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "order_requests" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerCompany" TEXT,
    "customerPhone" TEXT,
    "estimatedTotal" DECIMAL(12,2) NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_requests_number_key" ON "order_requests"("number");

-- CreateIndex
CREATE INDEX "order_requests_userId_idx" ON "order_requests"("userId");

-- CreateIndex
CREATE INDEX "order_requests_status_idx" ON "order_requests"("status");

-- CreateIndex
CREATE INDEX "request_items_requestId_idx" ON "request_items"("requestId");

-- AddForeignKey
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "order_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
