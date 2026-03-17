-- Değişkeni kendi e-posta adresinizle güncelleyin
update auth.users
set email_confirmed_at = now()
where email = 'ornek@domain.com'; -- Buraya kendi mailinizi yazın
