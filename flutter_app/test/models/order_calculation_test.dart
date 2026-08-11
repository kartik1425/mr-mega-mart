import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Order Calculation Tests', () {
    test('Calculates order total correctly with cargo fee', () {
      final items = [
        {'price': 120.0, 'quantity': 2}, // 240
        {'price': 350.0, 'quantity': 1}, // 350
      ];
      const double cargoFee = 50.0;

      final double subtotal = items.fold(
        0.0,
        (sum, item) => sum + ((item['price'] as double) * (item['quantity'] as int)),
      );
      final double total = subtotal + cargoFee;

      expect(subtotal, equals(590.0));
      expect(total, equals(640.0));
    });

    test('Free shipping applies when cargo fee is 0', () {
      final items = [
        {'price': 500.0, 'quantity': 2}, // 1000
      ];
      const double cargoFee = 0.0;

      final double subtotal = items.fold(
        0.0,
        (sum, item) => sum + ((item['price'] as double) * (item['quantity'] as int)),
      );
      final double total = subtotal + cargoFee;

      expect(subtotal, equals(1000.0));
      expect(total, equals(1000.0));
    });
  });
}
