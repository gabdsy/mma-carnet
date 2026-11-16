-- Test des règles de sécurité (RLS) de training_sessions.
-- À lancer dans Supabase > SQL Editor, autant de fois que voulu.
-- Il simule deux utilisateurs (A = le premier compte existant, B = un inconnu)
-- et un visiteur non connecté. Il ne laisse aucune donnée derrière lui.
-- Résultat attendu : une ligne « Tous les tests RLS passent ».
-- En cas de problème : une erreur rouge qui dit quel test a échoué.

do $$
declare
  user_a uuid := (select id from auth.users order by created_at limit 1);
  user_b uuid := gen_random_uuid();
  session_id uuid;
  n integer;
begin
  if user_a is null then
    raise exception 'Aucun compte dans Authentication > Users : crée-en un avant le test.';
  end if;

  -- 1. A crée une séance et la voit.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.training_sessions (session_type, duration_min, rpe)
  values ('mma', 90, 7)
  returning id into session_id;

  select count(*) into n from public.training_sessions where id = session_id;
  assert n = 1, 'Échec 1 : A ne voit pas sa propre séance.';

  -- 2. B ne la voit pas, ne peut ni la modifier ni la supprimer.
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.training_sessions where id = session_id;
  assert n = 0, 'Échec 2 : B voit la séance de A.';

  update public.training_sessions set notes = 'modifié par B' where id = session_id;
  get diagnostics n = row_count;
  assert n = 0, 'Échec 3 : B a pu modifier la séance de A.';

  delete from public.training_sessions where id = session_id;
  get diagnostics n = row_count;
  assert n = 0, 'Échec 4 : B a pu supprimer la séance de A.';

  -- 3. B ne peut pas créer une séance au nom de A.
  begin
    insert into public.training_sessions (user_id, session_type, duration_min)
    values (user_a, 'boxe', 60);
    raise exception 'Échec 5 : B a pu créer une séance au nom de A.';
  exception when insufficient_privilege then
    null; -- refus attendu
  end;

  -- 4. Un visiteur non connecté ne voit rien.
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
  set local role anon;
  select count(*) into n from public.training_sessions;
  assert n = 0, 'Échec 6 : un visiteur non connecté voit des séances.';

  -- 5. Nettoyage : A supprime sa séance de test.
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.training_sessions where id = session_id;
  get diagnostics n = row_count;
  assert n = 1, 'Échec 7 : A ne peut pas supprimer sa propre séance.';
end
$$;

select 'Tous les tests RLS passent' as resultat;
