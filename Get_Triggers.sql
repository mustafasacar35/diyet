SELECT event_object_schema, event_object_table, trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth') AND event_object_table IN ('users', 'profiles');
