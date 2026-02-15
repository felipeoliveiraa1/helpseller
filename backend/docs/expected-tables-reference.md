# Estrutura das tabelas (Supabase) — referência do projeto

Schema atual usado pelo dashboard. As relações (FK) precisam usar o **nome do constraint** quando há mais de um FK na mesma coluna.

---

## profiles

| Coluna            | Tipo   | Observação |
|-------------------|--------|------------|
| id                | uuid   | PK, FK → auth.users(id) ON DELETE CASCADE |
| email             | text   | not null |
| full_name         | text   | null |
| avatar_url        | text   | null |
| organization_id   | uuid   | FK → organizations(id) |
| role              | text   | default 'member', **CHECK: apenas 'MANAGER' ou 'SELLER'** |
| created_at        | timestamptz | |
| updated_at        | timestamptz | |

- Dashboard usa: `profiles!user_id(full_name)` e `select('role', 'organization_id')`.

---

## calls

| Coluna            | Tipo      | Observação |
|-------------------|-----------|------------|
| id                | uuid      | PK |
| user_id           | uuid      | FK → auth.users(id), FK → **profiles(id)** (constraint `calls_user_relationship`) |
| organization_id   | uuid      | FK → organizations(id) |
| script_id         | uuid      | FK → scripts(id), **constraint `calls_script_relationship`** |
| platform          | text      | null |
| status            | text      | default 'ACTIVE' |
| started_at        | timestamptz | default now() |
| ended_at          | timestamptz | null |
| duration_seconds  | integer   | null |
| transcript        | jsonb     | default '[]' |
| lead_profile      | jsonb     | default '{}' |
| summary           | jsonb     | null |
| created_at        | timestamptz | null |
| external_id       | text      | null |

- **Relação com scripts:** usar o nome do FK: `script:scripts!calls_script_relationship(name)`.
- Relação com profiles: `user:profiles!user_id(full_name)`.

---

## call_summaries

| Coluna                  | Tipo   |
|-------------------------|--------|
| id                      | uuid   |
| call_id                 | uuid   | UNIQUE, FK → calls(id) ON DELETE CASCADE |
| script_adherence_score  | integer | null |
| strengths               | text[] | null |
| improvements            | text[] | null |
| objections_faced       | jsonb  | null |
| buying_signals          | text[] | null |
| lead_sentiment          | text   | null |
| result                  | text   | null |
| ai_notes                | text   | null |
| created_at              | timestamptz | null |
| next_steps              | text[] | null |

- Dashboard usa: `call_summaries(lead_sentiment, result)` na query de calls.

---

## call_events

| Coluna      | Tipo      |
|-------------|-----------|
| id          | uuid      |
| call_id     | uuid      | FK → calls(id) ON DELETE CASCADE |
| event_type  | text      |
| content     | text      | null |
| metadata    | jsonb     | null |
| timestamp   | timestamptz | null default now() |

---

## scripts

| Coluna             | Tipo   |
|--------------------|--------|
| id                 | uuid   |
| organization_id    | uuid   | null, FK → organizations |
| name               | text   |
| description        | text   | null |
| coach_personality  | text   | default 'Strategic' |
| coach_tone         | text   | default 'Here is a tip' |
| intervention_level | text   | default 'Medium' |
| is_active          | boolean | default true |
| created_at         | timestamptz | null |

---

## organizations

| Coluna      | Tipo   |
|-------------|--------|
| id          | uuid   |
| name        | text   |
| slug        | text   | UNIQUE |
| created_at  | timestamptz | null |

---

## Observações

- **profiles.role:** no seu banco o CHECK é só `'MANAGER'` e `'SELLER'`. Se alguma política RLS usar `role = 'ADMIN'`, nunca vai dar match.
- **calls.script_id:** o constraint se chama **calls_script_relationship**; o dashboard usa `scripts!calls_script_relationship(name)`.
