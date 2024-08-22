from django.urls import path
from . import views

urlpatterns = [
	# path('', views.index, name='index'),
	path('register/', views.register, name='register'),
	path('login/', views.loginView, name='login'),
	path('profile/<str:nickname>', views.get_profile, name='profile'),
	path('settings/<str:nickname>', views.get_settings, name='settings'),
	path('updateSettings/<str:nickname>', views.updateSettings, name='updateSettings'),
	path('updatePassword/<str:nickname>', views.updatePassword, name='updatePassword'),
	path('stats/<int:user_id>', views.get_Stats, name='stats'),
	path('updateStats/<int:user_id>', views.update_Stats, name='updateStats'),
	path('status_user/', views.get_status_all_users, name='status_user'),
	path('logout/', views.logoutView, name='logout'),
	path('test_get_avatar/', views.test_get_avatar, name='test_get_avatar'),
]