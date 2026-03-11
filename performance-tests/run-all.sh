#!/bin/bash
echo "========================================"
echo "  API Performance Test Suite"
echo "========================================"
echo ""

REPORT_DIR="performance-tests/reports"
mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "[1/3] Testing Auth Service (port 5001)..."
npx artillery run performance-tests/auth-service.yml --output "$REPORT_DIR/auth-$TIMESTAMP.json" 2>&1
npx artillery report "$REPORT_DIR/auth-$TIMESTAMP.json" --output "$REPORT_DIR/auth-$TIMESTAMP.html" 2>/dev/null
echo ""

echo "[2/3] Testing Property Service (port 5002)..."
npx artillery run performance-tests/property-service.yml --output "$REPORT_DIR/property-$TIMESTAMP.json" 2>&1
npx artillery report "$REPORT_DIR/property-$TIMESTAMP.json" --output "$REPORT_DIR/property-$TIMESTAMP.html" 2>/dev/null
echo ""

echo "[3/3] Testing Residency Service (port 5003)..."
npx artillery run performance-tests/residency-service.yml --output "$REPORT_DIR/residency-$TIMESTAMP.json" 2>&1
npx artillery report "$REPORT_DIR/residency-$TIMESTAMP.json" --output "$REPORT_DIR/residency-$TIMESTAMP.html" 2>/dev/null
echo ""

echo "========================================"
echo "  All tests complete!"
echo "  Reports saved to: $REPORT_DIR/"
echo "========================================"
