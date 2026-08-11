import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Cart Item Subtotal Calculation Tests', () {
    test('Calculates subtotal correctly for given quantity and unit price', () {
      const double unitPrice = 249.0;
      const int quantity = 3;

      final double subtotal = unitPrice * quantity;

      expect(subtotal, equals(747.0));
    });

    test('Handles zero quantity cleanly', () {
      const double unitPrice = 150.0;
      const int quantity = 0;

      final double subtotal = unitPrice * quantity;

      expect(subtotal, equals(0.0));
    });
  });
}
