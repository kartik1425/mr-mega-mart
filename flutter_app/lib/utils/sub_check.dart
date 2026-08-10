import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user/user_pref_model.dart';

Future<bool> isSubscribed() async {
  final prefs = await SharedPreferences.getInstance();
  final userJson = prefs.getString('user');
  if (userJson != null) {
    Map<String, dynamic> userMap = jsonDecode(userJson);
    UserPreferencesModel user = UserPreferencesModel.fromJson(userMap);
    return user.isSubscriber;
  }
  return false;
}

Future<void> updateSubscriptionStatus(bool isSubscribed) async {
  final prefs = await SharedPreferences.getInstance();
  final userJson = prefs.getString('user');
  if (userJson != null) {
    Map<String, dynamic> userMap = jsonDecode(userJson);
    UserPreferencesModel user = UserPreferencesModel.fromJson(userMap);
    UserPreferencesModel updatedUser = UserPreferencesModel(
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isSubscriber: isSubscribed,
      hasActiveTrial: user.hasActiveTrial,
    );
    await _saveUser(updatedUser);
  }
}

Future<void> _saveUser(UserPreferencesModel user) async {
  final prefs = await SharedPreferences.getInstance();
  String userJson = jsonEncode(user.toJson());
  await prefs.setString('user', userJson);
}
