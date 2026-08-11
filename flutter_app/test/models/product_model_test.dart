import 'package:flutter_test/flutter_test.dart';
import 'package:mrmegamart_app/models/product/product_model.dart';

void main() {
  group('Product Model Tests', () {
    test('Product.fromJson parses valid json correctly', () {
      final jsonMap = {
        '_id': 'prod123',
        'imageURLs': ['https://example.com/image.jpg'],
        'title': 'Fresh Organic Apples',
        'description': 'Crisp and sweet fresh apples.',
        'price': 120.0,
        'salePrice': 100.0,
        'oldPrice': 140.0,
        'stockCount': 25,
        'category': {
          '_id': 'cat1',
          'name': 'Fruits',
          'description': 'Fresh Fruits'
        },
        'tags': ['fresh', 'organic'],
        'cargoWeight': 1.0,
        'createdAt': '2026-08-10T12:00:00.000Z',
        'updatedAt': '2026-08-10T12:00:00.000Z',
        'averageRating': 4.8,
        'likeCount': 15,
        'reviewCount': 8,
      };

      final product = Product.fromJson(jsonMap);

      expect(product.id, 'prod123');
      expect(product.title, 'Fresh Organic Apples');
      expect(product.price, 120.0);
      expect(product.salePrice, 100.0);
      expect(product.cargoWeight, 1.0);
      expect(product.stockCount, 25);
    });
  });
}
