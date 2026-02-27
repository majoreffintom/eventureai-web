# Database Backup — AI Memory Index DB
## Generated: 2026-02-21
## Status: All 54 tables exist, all are EMPTY (0 rows)

---

## Full Schema (pg_dump format)

```sql
--
-- PostgreSQL database dump
-- Dumped from database version 17.8
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================================
-- TABLE: app_dependencies
-- ============================================================
CREATE TABLE public.app_dependencies (
    id integer NOT NULL,
    app_id integer,
    depends_on_app_id integer,
    dependency_type character varying(100) NOT NULL,
    is_critical boolean DEFAULT true,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT app_dependencies_check CHECK ((app_id <> depends_on_app_id))
);

CREATE SEQUENCE public.app_dependencies_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.app_dependencies_id_seq OWNED BY public.app_dependencies.id;
ALTER TABLE ONLY public.app_dependencies ALTER COLUMN id SET DEFAULT nextval('public.app_dependencies_id_seq'::regclass);
ALTER TABLE ONLY public.app_dependencies ADD CONSTRAINT app_dependencies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_dependencies ADD CONSTRAINT app_dependencies_app_id_depends_on_app_id_dependency_type_key UNIQUE (app_id, depends_on_app_id, dependency_type);
CREATE INDEX idx_app_dependencies_app ON public.app_dependencies USING btree (app_id);
CREATE INDEX idx_app_dependencies_depends ON public.app_dependencies USING btree (depends_on_app_id);
ALTER TABLE ONLY public.app_dependencies ADD CONSTRAINT app_dependencies_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.app_dependencies ADD CONSTRAINT app_dependencies_depends_on_app_id_fkey FOREIGN KEY (depends_on_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: app_secrets
-- ============================================================
CREATE TABLE public.app_secrets (
    id integer NOT NULL,
    app_id integer,
    secret_key character varying(255) NOT NULL,
    secret_value text,
    environment character varying(50) DEFAULT 'production'::character varying,
    is_required boolean DEFAULT true,
    description text,
    last_rotated timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.app_secrets_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.app_secrets_id_seq OWNED BY public.app_secrets.id;
ALTER TABLE ONLY public.app_secrets ALTER COLUMN id SET DEFAULT nextval('public.app_secrets_id_seq'::regclass);
ALTER TABLE ONLY public.app_secrets ADD CONSTRAINT app_secrets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_secrets ADD CONSTRAINT app_secrets_app_id_secret_key_environment_key UNIQUE (app_id, secret_key, environment);
CREATE INDEX idx_app_secrets_app ON public.app_secrets USING btree (app_id);
CREATE INDEX idx_app_secrets_env ON public.app_secrets USING btree (environment);
ALTER TABLE ONLY public.app_secrets ADD CONSTRAINT app_secrets_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: apps
-- ============================================================
CREATE TABLE public.apps (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    app_type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    domain character varying(255),
    repository_url character varying(500),
    deployment_status character varying(50),
    api_base_url character varying(500),
    documentation_url character varying(500),
    provider_name character varying(255),
    description text,
    version character varying(50),
    environment character varying(50) DEFAULT 'production'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT apps_app_type_check CHECK (((app_type)::text = ANY ((ARRAY['internal'::character varying, 'external_api'::character varying, 'saas_tool'::character varying])::text[]))),
    CONSTRAINT apps_environment_check CHECK (((environment)::text = ANY ((ARRAY['production'::character varying, 'staging'::character varying, 'development'::character varying])::text[]))),
    CONSTRAINT apps_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'deprecated'::character varying])::text[])))
);

CREATE SEQUENCE public.apps_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.apps_id_seq OWNED BY public.apps.id;
ALTER TABLE ONLY public.apps ALTER COLUMN id SET DEFAULT nextval('public.apps_id_seq'::regclass);
ALTER TABLE ONLY public.apps ADD CONSTRAINT apps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.apps ADD CONSTRAINT apps_domain_unique UNIQUE (domain);
CREATE INDEX idx_apps_environment ON public.apps USING btree (environment);
CREATE INDEX idx_apps_status ON public.apps USING btree (status);
CREATE INDEX idx_apps_type ON public.apps USING btree (app_type);

-- ============================================================
-- TABLE: auth_accounts
-- ============================================================
CREATE TABLE public.auth_accounts (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    "providerAccountId" character varying(255) NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    id_token text,
    scope text,
    session_state text,
    token_type text,
    password text
);

CREATE SEQUENCE public.auth_accounts_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.auth_accounts_id_seq OWNED BY public.auth_accounts.id;
ALTER TABLE ONLY public.auth_accounts ALTER COLUMN id SET DEFAULT nextval('public.auth_accounts_id_seq'::regclass);
ALTER TABLE ONLY public.auth_accounts ADD CONSTRAINT auth_accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.auth_accounts ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.auth_users(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: auth_sessions
-- ============================================================
CREATE TABLE public.auth_sessions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    expires timestamp with time zone NOT NULL,
    "sessionToken" character varying(255) NOT NULL
);

CREATE SEQUENCE public.auth_sessions_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.auth_sessions_id_seq OWNED BY public.auth_sessions.id;
ALTER TABLE ONLY public.auth_sessions ALTER COLUMN id SET DEFAULT nextval('public.auth_sessions_id_seq'::regclass);
ALTER TABLE ONLY public.auth_sessions ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.auth_sessions ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.auth_users(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: auth_users
-- ============================================================
CREATE TABLE public.auth_users (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    "emailVerified" timestamp with time zone,
    image text
);

CREATE SEQUENCE public.auth_users_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.auth_users_id_seq OWNED BY public.auth_users.id;
ALTER TABLE ONLY public.auth_users ALTER COLUMN id SET DEFAULT nextval('public.auth_users_id_seq'::regclass);
ALTER TABLE ONLY public.auth_users ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);

-- ============================================================
-- TABLE: auth_verification_token
-- ============================================================
CREATE TABLE public.auth_verification_token (
    identifier text NOT NULL,
    expires timestamp with time zone NOT NULL,
    token text NOT NULL
);

ALTER TABLE ONLY public.auth_verification_token ADD CONSTRAINT auth_verification_token_pkey PRIMARY KEY (identifier, token);

-- ============================================================
-- TABLE: beta_waitlist
-- ============================================================
CREATE TABLE public.beta_waitlist (
    id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    email text NOT NULL,
    full_name text,
    company text,
    notes text,
    source text DEFAULT 'website'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.beta_waitlist ADD CONSTRAINT beta_waitlist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.beta_waitlist ADD CONSTRAINT beta_waitlist_email_unique UNIQUE (email);
CREATE INDEX idx_beta_waitlist_created_at ON public.beta_waitlist USING btree (created_at DESC);

-- ============================================================
-- TABLE: blockchain_ledger
-- ============================================================
CREATE TABLE public.blockchain_ledger (
    id integer NOT NULL,
    transaction_hash character varying(255) NOT NULL,
    blockchain_network character varying(100) NOT NULL,
    transaction_type character varying(100) NOT NULL,
    amount numeric(20,8),
    currency character varying(20),
    from_address character varying(255),
    to_address character varying(255),
    block_number bigint,
    gas_used bigint,
    gas_price numeric(20,8),
    status character varying(50) DEFAULT 'pending'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.blockchain_ledger_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.blockchain_ledger_id_seq OWNED BY public.blockchain_ledger.id;
ALTER TABLE ONLY public.blockchain_ledger ALTER COLUMN id SET DEFAULT nextval('public.blockchain_ledger_id_seq'::regclass);
ALTER TABLE ONLY public.blockchain_ledger ADD CONSTRAINT blockchain_ledger_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blockchain_ledger ADD CONSTRAINT blockchain_ledger_transaction_hash_key UNIQUE (transaction_hash);
CREATE INDEX idx_blockchain_ledger_hash ON public.blockchain_ledger USING btree (transaction_hash);
CREATE INDEX idx_blockchain_ledger_network ON public.blockchain_ledger USING btree (blockchain_network);
CREATE INDEX idx_blockchain_ledger_status ON public.blockchain_ledger USING btree (status);

-- ============================================================
-- TABLE: business_applications
-- ============================================================
CREATE TABLE public.business_applications (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    url character varying(500),
    app_type character varying(100) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'registered'::character varying,
    last_health_check timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.business_applications_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.business_applications_id_seq OWNED BY public.business_applications.id;
ALTER TABLE ONLY public.business_applications ALTER COLUMN id SET DEFAULT nextval('public.business_applications_id_seq'::regclass);
ALTER TABLE ONLY public.business_applications ADD CONSTRAINT business_applications_pkey PRIMARY KEY (id);
CREATE INDEX idx_business_applications_status ON public.business_applications USING btree (status);
CREATE INDEX idx_business_applications_type ON public.business_applications USING btree (app_type);

-- ============================================================
-- TABLE: cancellation_audit
-- ============================================================
CREATE TABLE public.cancellation_audit (
    id integer NOT NULL,
    item_type character varying(50) NOT NULL,
    item_id integer NOT NULL,
    summary text,
    processed boolean DEFAULT false,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.cancellation_audit_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.cancellation_audit_id_seq OWNED BY public.cancellation_audit.id;
ALTER TABLE ONLY public.cancellation_audit ALTER COLUMN id SET DEFAULT nextval('public.cancellation_audit_id_seq'::regclass);
ALTER TABLE ONLY public.cancellation_audit ADD CONSTRAINT cancellation_audit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cancellation_audit ADD CONSTRAINT cancellation_audit_unique UNIQUE (item_type, item_id);
CREATE INDEX idx_cancellation_audit_item ON public.cancellation_audit USING btree (item_type, item_id);

-- ============================================================
-- TABLE: categorization_patterns
-- ============================================================
CREATE TABLE public.categorization_patterns (
    id integer NOT NULL,
    content_analysis text NOT NULL,
    chosen_category integer,
    chosen_cluster integer,
    confidence_score integer,
    improvement_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categorization_patterns_confidence_score_check CHECK (((confidence_score >= 1) AND (confidence_score <= 10)))
);

CREATE SEQUENCE public.categorization_patterns_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.categorization_patterns_id_seq OWNED BY public.categorization_patterns.id;
ALTER TABLE ONLY public.categorization_patterns ALTER COLUMN id SET DEFAULT nextval('public.categorization_patterns_id_seq'::regclass);
ALTER TABLE ONLY public.categorization_patterns ADD CONSTRAINT categorization_patterns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categorization_patterns ADD CONSTRAINT categorization_patterns_chosen_category_fkey FOREIGN KEY (chosen_category) REFERENCES public.index_categories(id);
ALTER TABLE ONLY public.categorization_patterns ADD CONSTRAINT categorization_patterns_chosen_cluster_fkey FOREIGN KEY (chosen_cluster) REFERENCES public.sub_index_clusters(id);

-- ============================================================
-- TABLE: concept_relationships
-- ============================================================
CREATE TABLE public.concept_relationships (
    id integer NOT NULL,
    from_memory_id integer,
    to_memory_id integer,
    relationship_strength integer,
    connection_type character varying(100) NOT NULL,
    reasoning text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT concept_relationships_relationship_strength_check CHECK (((relationship_strength >= 1) AND (relationship_strength <= 10)))
);

CREATE SEQUENCE public.concept_relationships_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.concept_relationships_id_seq OWNED BY public.concept_relationships.id;
ALTER TABLE ONLY public.concept_relationships ALTER COLUMN id SET DEFAULT nextval('public.concept_relationships_id_seq'::regclass);
ALTER TABLE ONLY public.concept_relationships ADD CONSTRAINT concept_relationships_pkey PRIMARY KEY (id);
CREATE INDEX idx_concept_relationships_strength ON public.concept_relationships USING btree (relationship_strength);
ALTER TABLE ONLY public.concept_relationships ADD CONSTRAINT concept_relationships_from_memory_id_fkey FOREIGN KEY (from_memory_id) REFERENCES public.memory_entries(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.concept_relationships ADD CONSTRAINT concept_relationships_to_memory_id_fkey FOREIGN KEY (to_memory_id) REFERENCES public.memory_entries(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: cross_pollinations
-- ============================================================
CREATE TABLE public.cross_pollinations (
    id integer NOT NULL,
    source_app_id integer,
    target_app_id integer,
    source_domain character varying(100) NOT NULL,
    target_domain character varying(100) NOT NULL,
    original_insight jsonb NOT NULL,
    bridged_insight jsonb,
    bridge_strength numeric(3,2),
    application_success boolean,
    impact_score integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    applied_at timestamp without time zone,
    CONSTRAINT cross_pollinations_bridge_strength_check CHECK (((bridge_strength >= (0)::numeric) AND (bridge_strength <= (1)::numeric))),
    CONSTRAINT cross_pollinations_impact_score_check CHECK (((impact_score >= 1) AND (impact_score <= 10)))
);

CREATE SEQUENCE public.cross_pollinations_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.cross_pollinations_id_seq OWNED BY public.cross_pollinations.id;
ALTER TABLE ONLY public.cross_pollinations ALTER COLUMN id SET DEFAULT nextval('public.cross_pollinations_id_seq'::regclass);
ALTER TABLE ONLY public.cross_pollinations ADD CONSTRAINT cross_pollinations_pkey PRIMARY KEY (id);
CREATE INDEX idx_cross_pollinations_bridge ON public.cross_pollinations USING btree (source_domain, target_domain);
CREATE INDEX idx_cross_pollinations_strength ON public.cross_pollinations USING btree (bridge_strength);
ALTER TABLE ONLY public.cross_pollinations ADD CONSTRAINT cross_pollinations_source_app_id_fkey FOREIGN KEY (source_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cross_pollinations ADD CONSTRAINT cross_pollinations_target_app_id_fkey FOREIGN KEY (target_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE public.customers (
    id integer NOT NULL,
    stripe_customer_id character varying(255),
    business_name character varying(255),
    contact_name character varying(255),
    email character varying(255) NOT NULL,
    phone character varying(50),
    billing_address jsonb,
    tax_id character varying(100),
    customer_type character varying(50) DEFAULT 'individual'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.customers_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;
ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);
ALTER TABLE ONLY public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customers ADD CONSTRAINT customers_stripe_customer_id_key UNIQUE (stripe_customer_id);
CREATE INDEX idx_customers_email ON public.customers USING btree (email);
CREATE INDEX idx_customers_stripe ON public.customers USING btree (stripe_customer_id);

-- ============================================================
-- TABLE: deployment_history
-- ============================================================
CREATE TABLE public.deployment_history (
    id integer NOT NULL,
    application_id integer,
    version character varying(50) NOT NULL,
    deployment_type character varying(100) NOT NULL,
    description text,
    changes_summary text,
    deployed_by character varying(255),
    status character varying(50) DEFAULT 'in_progress'::character varying,
    rollback_version character varying(50),
    deployment_duration_seconds integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.deployment_history_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.deployment_history_id_seq OWNED BY public.deployment_history.id;
ALTER TABLE ONLY public.deployment_history ALTER COLUMN id SET DEFAULT nextval('public.deployment_history_id_seq'::regclass);
ALTER TABLE ONLY public.deployment_history ADD CONSTRAINT deployment_history_pkey PRIMARY KEY (id);
CREATE INDEX idx_deployment_history_app ON public.deployment_history USING btree (application_id);
CREATE INDEX idx_deployment_history_status ON public.deployment_history USING btree (status);
ALTER TABLE ONLY public.deployment_history ADD CONSTRAINT deployment_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.business_applications(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: enterprise_app_tasks
-- ============================================================
CREATE TABLE public.enterprise_app_tasks (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    app_key text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    created_by_user_id integer,
    assigned_to_user_id integer,
    source_thread_id bigint,
    source_turn_id bigint,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT enterprise_app_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT enterprise_app_tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'blocked'::text, 'done'::text])))
);

ALTER TABLE ONLY public.enterprise_app_tasks ADD CONSTRAINT enterprise_app_tasks_pkey PRIMARY KEY (id);
CREATE INDEX idx_enterprise_app_tasks_app_key ON public.enterprise_app_tasks USING btree (app_key);
CREATE INDEX idx_enterprise_app_tasks_created_at ON public.enterprise_app_tasks USING btree (created_at DESC);
CREATE INDEX idx_enterprise_app_tasks_status ON public.enterprise_app_tasks USING btree (status);
ALTER TABLE ONLY public.enterprise_app_tasks ADD CONSTRAINT enterprise_app_tasks_app_key_fkey FOREIGN KEY (app_key) REFERENCES public.enterprise_apps(key) ON DELETE CASCADE;
ALTER TABLE ONLY public.enterprise_app_tasks ADD CONSTRAINT enterprise_app_tasks_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.enterprise_app_tasks ADD CONSTRAINT enterprise_app_tasks_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.enterprise_app_tasks ADD CONSTRAINT enterprise_app_tasks_source_thread_id_fkey FOREIGN KEY (source_thread_id) REFERENCES public.memoria_threads(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.enterprise_app_tasks ADD CONSTRAINT enterprise_app_tasks_source_turn_id_fkey FOREIGN KEY (source_turn_id) REFERENCES public.memoria_turns(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: enterprise_apps
-- ============================================================
CREATE TABLE public.enterprise_apps (
    key text NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.enterprise_apps ADD CONSTRAINT enterprise_apps_pkey PRIMARY KEY (key);

-- ============================================================
-- TABLE: eventureai_documents
-- ============================================================
CREATE TABLE public.eventureai_documents (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    user_id integer,
    title text NOT NULL,
    doc_url text,
    doc_mime_type text,
    notes text,
    fields jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.eventureai_documents ADD CONSTRAINT eventureai_documents_pkey PRIMARY KEY (id);
CREATE INDEX idx_eventureai_documents_user_id_created_at ON public.eventureai_documents USING btree (user_id, created_at DESC);
ALTER TABLE ONLY public.eventureai_documents ADD CONSTRAINT eventureai_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: expense_categories
-- ============================================================
CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    app_id integer,
    category_type character varying(100) NOT NULL,
    budget_monthly numeric(12,2),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.expense_categories_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;
ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);
ALTER TABLE ONLY public.expense_categories ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.expense_categories ADD CONSTRAINT expense_categories_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.apps(id);

-- ============================================================
-- TABLE: financial_reports
-- ============================================================
CREATE TABLE public.financial_reports (
    id integer NOT NULL,
    report_type character varying(100) NOT NULL,
    app_id integer,
    report_period character varying(50),
    report_data jsonb NOT NULL,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.financial_reports_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.financial_reports_id_seq OWNED BY public.financial_reports.id;
ALTER TABLE ONLY public.financial_reports ALTER COLUMN id SET DEFAULT nextval('public.financial_reports_id_seq'::regclass);
ALTER TABLE ONLY public.financial_reports ADD CONSTRAINT financial_reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.financial_reports ADD CONSTRAINT financial_reports_report_type_app_id_report_period_key UNIQUE (report_type, app_id, report_period);
CREATE INDEX idx_financial_reports_period ON public.financial_reports USING btree (report_period);
ALTER TABLE ONLY public.financial_reports ADD CONSTRAINT financial_reports_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.apps(id);

-- ============================================================
-- TABLE: index_categories
-- ============================================================
CREATE TABLE public.index_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    intent_type character varying(100) NOT NULL,
    complexity_level character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.index_categories_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.index_categories_id_seq OWNED BY public.index_categories.id;
ALTER TABLE ONLY public.index_categories ALTER COLUMN id SET DEFAULT nextval('public.index_categories_id_seq'::regclass);
ALTER TABLE ONLY public.index_categories ADD CONSTRAINT index_categories_pkey PRIMARY KEY (id);

-- ============================================================
-- TABLE: insight_propagations
-- ============================================================
CREATE TABLE public.insight_propagations (
    id integer NOT NULL,
    original_insight_id integer,
    propagation_path integer[],
    mutation_level numeric(3,2) DEFAULT 0,
    final_applications jsonb,
    network_reach integer DEFAULT 0,
    effectiveness_score numeric(3,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.insight_propagations_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.insight_propagations_id_seq OWNED BY public.insight_propagations.id;
ALTER TABLE ONLY public.insight_propagations ALTER COLUMN id SET DEFAULT nextval('public.insight_propagations_id_seq'::regclass);
ALTER TABLE ONLY public.insight_propagations ADD CONSTRAINT insight_propagations_pkey PRIMARY KEY (id);

-- ============================================================
-- TABLE: inter_agent_communications
-- ============================================================
CREATE TABLE public.inter_agent_communications (
    id integer NOT NULL,
    source_app_id integer,
    target_app_id integer,
    insight_type character varying(100) NOT NULL,
    original_insight jsonb NOT NULL,
    translated_insight jsonb,
    relevance_score numeric(3,2),
    transferability_score numeric(3,2),
    confidence_level numeric(3,2),
    domain_bridge jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone,
    feedback_score integer,
    CONSTRAINT inter_agent_communications_confidence_level_check CHECK (((confidence_level >= (0)::numeric) AND (confidence_level <= (1)::numeric))),
    CONSTRAINT inter_agent_communications_feedback_score_check CHECK (((feedback_score >= 1) AND (feedback_score <= 10))),
    CONSTRAINT inter_agent_communications_relevance_score_check CHECK (((relevance_score >= (0)::numeric) AND (relevance_score <= (1)::numeric))),
    CONSTRAINT inter_agent_communications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processed'::character varying, 'rejected'::character varying, 'applied'::character varying])::text[]))),
    CONSTRAINT inter_agent_communications_transferability_score_check CHECK (((transferability_score >= (0)::numeric) AND (transferability_score <= (1)::numeric)))
);

CREATE SEQUENCE public.inter_agent_communications_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.inter_agent_communications_id_seq OWNED BY public.inter_agent_communications.id;
ALTER TABLE ONLY public.inter_agent_communications ALTER COLUMN id SET DEFAULT nextval('public.inter_agent_communications_id_seq'::regclass);
ALTER TABLE ONLY public.inter_agent_communications ADD CONSTRAINT inter_agent_communications_pkey PRIMARY KEY (id);
CREATE INDEX idx_inter_agent_relevance ON public.inter_agent_communications USING btree (relevance_score);
CREATE INDEX idx_inter_agent_source ON public.inter_agent_communications USING btree (source_app_id);
CREATE INDEX idx_inter_agent_status ON public.inter_agent_communications USING btree (status);
CREATE INDEX idx_inter_agent_target ON public.inter_agent_communications USING btree (target_app_id);
ALTER TABLE ONLY public.inter_agent_communications ADD CONSTRAINT inter_agent_communications_source_app_id_fkey FOREIGN KEY (source_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.inter_agent_communications ADD CONSTRAINT inter_agent_communications_target_app_id_fkey FOREIGN KEY (target_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: invoices
-- ============================================================
CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    customer_id integer,
    app_id integer,
    stripe_invoice_id character varying(255),
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    status character varying(50) DEFAULT 'draft'::character varying,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    paid_date date,
    description text,
    invoice_items jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.invoices_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;
ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
CREATE INDEX idx_invoices_customer ON public.invoices USING btree (customer_id);
CREATE INDEX idx_invoices_date ON public.invoices USING btree (issue_date);
CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.apps(id);

-- ============================================================
-- TABLE: mail_server_logs
-- ============================================================
CREATE TABLE public.mail_server_logs (
    id integer NOT NULL,
    message_id character varying(255),
    operation_type character varying(100) NOT NULL,
    from_address character varying(255),
    to_address character varying(255)[],
    cc_address character varying(255)[],
    bcc_address character varying(255)[],
    subject character varying(500),
    body_preview text,
    attachments integer DEFAULT 0,
    status character varying(50) DEFAULT 'processing'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.mail_server_logs_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.mail_server_logs_id_seq OWNED BY public.mail_server_logs.id;
ALTER TABLE ONLY public.mail_server_logs ALTER COLUMN id SET DEFAULT nextval('public.mail_server_logs_id_seq'::regclass);
ALTER TABLE ONLY public.mail_server_logs ADD CONSTRAINT mail_server_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.mail_server_logs ADD CONSTRAINT mail_server_logs_message_id_key UNIQUE (message_id);
CREATE INDEX idx_mail_server_logs_operation ON public.mail_server_logs USING btree (operation_type);
CREATE INDEX idx_mail_server_logs_status ON public.mail_server_logs USING btree (status);

-- ============================================================
-- TABLE: memoria_admins
-- ============================================================
CREATE TABLE public.memoria_admins (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    email text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_email text
);

ALTER TABLE ONLY public.memoria_admins ADD CONSTRAINT memoria_admins_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memoria_admins ADD CONSTRAINT memoria_admins_email_key UNIQUE (email);
CREATE INDEX idx_memoria_admins_created_at ON public.memoria_admins USING btree (created_at DESC);
CREATE INDEX idx_memoria_admins_email ON public.memoria_admins USING btree (email);

-- ============================================================
-- TABLE: memoria_api_tokens
-- ============================================================
CREATE TABLE public.memoria_api_tokens (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    token_id text NOT NULL,
    token_hash text NOT NULL,
    label text,
    scope text DEFAULT 'memoria'::text NOT NULL,
    app_source text DEFAULT 'unknown'::text NOT NULL,
    can_read boolean DEFAULT true NOT NULL,
    can_write boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone,
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rate_limit_per_minute integer,
    CONSTRAINT memoria_api_tokens_token_id_nonempty CHECK ((length(token_id) > 8))
);

ALTER TABLE ONLY public.memoria_api_tokens ADD CONSTRAINT memoria_api_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memoria_api_tokens ADD CONSTRAINT memoria_api_tokens_token_id_key UNIQUE (token_id);
CREATE INDEX idx_memoria_api_tokens_active ON public.memoria_api_tokens USING btree (is_active);
CREATE INDEX idx_memoria_api_tokens_app_source ON public.memoria_api_tokens USING btree (app_source);
CREATE INDEX idx_memoria_api_tokens_created_at ON public.memoria_api_tokens USING btree (created_at DESC);
CREATE INDEX idx_memoria_api_tokens_scope ON public.memoria_api_tokens USING btree (scope);

-- ============================================================
-- TABLE: memoria_api_token_usage
-- ============================================================
CREATE TABLE public.memoria_api_token_usage (
    token_id text NOT NULL,
    window_start timestamp without time zone NOT NULL,
    request_count integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY public.memoria_api_token_usage ADD CONSTRAINT memoria_api_token_usage_pkey PRIMARY KEY (token_id, window_start);
CREATE INDEX idx_memoria_api_token_usage_window_start ON public.memoria_api_token_usage USING btree (window_start DESC);
ALTER TABLE ONLY public.memoria_api_token_usage ADD CONSTRAINT memoria_api_token_usage_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.memoria_api_tokens(token_id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: memoria_indexes
-- ============================================================
CREATE TABLE public.memoria_indexes (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    key text NOT NULL,
    name text,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.memoria_indexes ADD CONSTRAINT memoria_indexes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memoria_indexes ADD CONSTRAINT memoria_indexes_key_key UNIQUE (key);

-- ============================================================
-- TABLE: memoria_subindexes
-- ============================================================
CREATE TABLE public.memoria_subindexes (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    memoria_index_id bigint NOT NULL,
    key text NOT NULL,
    name text,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.memoria_subindexes ADD CONSTRAINT memoria_subindexes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memoria_subindexes ADD CONSTRAINT memoria_subindexes_memoria_index_id_key_key UNIQUE (memoria_index_id, key);
ALTER TABLE ONLY public.memoria_subindexes ADD CONSTRAINT memoria_subindexes_memoria_index_id_fkey FOREIGN KEY (memoria_index_id) REFERENCES public.memoria_indexes(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: memoria_threads
-- ============================================================
CREATE TABLE public.memoria_threads (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    external_id text NOT NULL,
    app_source text DEFAULT 'unknown'::text NOT NULL,
    title text,
    context text,
    memoria_index_id bigint,
    memoria_subindex_id bigint,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_turn_at timestamp without time zone
);

ALTER TABLE ONLY public.memoria_threads ADD CONSTRAINT memoria_threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memoria_threads ADD CONSTRAINT memoria_threads_external_id_key UNIQUE (external_id);
CREATE INDEX idx_memoria_threads_index_subindex ON public.memoria_threads USING btree (memoria_index_id, memoria_subindex_id);
CREATE INDEX idx_memoria_threads_last_turn_at ON public.memoria_threads USING btree (last_turn_at DESC);
CREATE INDEX idx_memoria_threads_source ON public.memoria_threads USING btree (app_source);
CREATE INDEX idx_memoria_threads_updated_at ON public.memoria_threads USING btree (updated_at DESC);
ALTER TABLE ONLY public.memoria_threads ADD CONSTRAINT memoria_threads_memoria_index_id_fkey FOREIGN KEY (memoria_index_id) REFERENCES public.memoria_indexes(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.memoria_threads ADD CONSTRAINT memoria_threads_memoria_subindex_id_fkey FOREIGN KEY (memoria_subindex_id) REFERENCES public.memoria_subindexes(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: memoria_turns
-- ============================================================
CREATE TABLE public.memoria_turns (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    thread_id bigint NOT NULL,
    external_turn_id text,
    turn_index integer NOT NULL,
    user_text text,
    assistant_thinking_summary text,
    assistant_synthesis text,
    code_summary text,
    assistant_response text,
    raw_messages jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY public.memoria_turns ADD CONSTRAINT memoria_turns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memoria_turns ADD CONSTRAINT memoria_turns_thread_id_external_turn_id_key UNIQUE (thread_id, external_turn_id);
ALTER TABLE ONLY public.memoria_turns ADD CONSTRAINT memoria_turns_thread_id_turn_index_key UNIQUE (thread_id, turn_index);
CREATE INDEX idx_memoria_turns_external_turn_id ON public.memoria_turns USING btree (external_turn_id) WHERE (external_turn_id IS NOT NULL);
CREATE INDEX idx_memoria_turns_search ON public.memoria_turns USING gin (to_tsvector('english'::regconfig, ((((((COALESCE(user_text, ''::text) || ' '::text) || COALESCE(assistant_response, ''::text)) || ' '::text) || COALESCE(assistant_synthesis, ''::text)) || ' '::text) || COALESCE(code_summary, ''::text))));
CREATE INDEX idx_memoria_turns_thread_created_at ON public.memoria_turns USING btree (thread_id, created_at DESC);
ALTER TABLE ONLY public.memoria_turns ADD CONSTRAINT memoria_turns_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.memoria_threads(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: memory_entries
-- ============================================================
CREATE TABLE public.memory_entries (
    id integer NOT NULL,
    sub_index_cluster_id integer,
    content text NOT NULL,
    reasoning_chain text,
    user_intent_analysis text,
    cross_domain_connections text[],
    usage_frequency integer DEFAULT 0,
    session_context text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    accessed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.memory_entries_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.memory_entries_id_seq OWNED BY public.memory_entries.id;
ALTER TABLE ONLY public.memory_entries ALTER COLUMN id SET DEFAULT nextval('public.memory_entries_id_seq'::regclass);
ALTER TABLE ONLY public.memory_entries ADD CONSTRAINT memory_entries_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_accessed_at ON public.memory_entries USING btree (accessed_at);
CREATE INDEX idx_memory_entries_content ON public.memory_entries USING gin (to_tsvector('english'::regconfig, content));
ALTER TABLE ONLY public.memory_entries ADD CONSTRAINT memory_entries_sub_index_cluster_id_fkey FOREIGN KEY (sub_index_cluster_id) REFERENCES public.sub_index_clusters(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: memory_tournament_agents
-- ============================================================
CREATE TABLE public.memory_tournament_agents (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    owner_user_id integer,
    name text NOT NULL,
    description text,
    system_prompt text,
    integration_endpoint text DEFAULT '/integrations/chat-gpt/conversationgpt4'::text NOT NULL,
    model_label text,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.memory_tournament_agents ADD CONSTRAINT memory_tournament_agents_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournament_agents_owner_user_id ON public.memory_tournament_agents USING btree (owner_user_id);
ALTER TABLE ONLY public.memory_tournament_agents ADD CONSTRAINT memory_tournament_agents_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: memory_tournament_agent_chats
-- ============================================================
CREATE TABLE public.memory_tournament_agent_chats (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    agent_id bigint NOT NULL,
    user_id integer,
    title text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.memory_tournament_agent_chats ADD CONSTRAINT memory_tournament_agent_chats_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournament_agent_chats_agent_id ON public.memory_tournament_agent_chats USING btree (agent_id);
ALTER TABLE ONLY public.memory_tournament_agent_chats ADD CONSTRAINT memory_tournament_agent_chats_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.memory_tournament_agents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.memory_tournament_agent_chats ADD CONSTRAINT memory_tournament_agent_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: memory_tournament_agent_chat_messages
-- ============================================================
CREATE TABLE public.memory_tournament_agent_chat_messages (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    chat_id bigint NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT memory_tournament_agent_chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);

ALTER TABLE ONLY public.memory_tournament_agent_chat_messages ADD CONSTRAINT memory_tournament_agent_chat_messages_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournament_agent_chat_messages_chat_id ON public.memory_tournament_agent_chat_messages USING btree (chat_id);
ALTER TABLE ONLY public.memory_tournament_agent_chat_messages ADD CONSTRAINT memory_tournament_agent_chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.memory_tournament_agent_chats(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: memory_tournament_agent_knowledge
-- ============================================================
CREATE TABLE public.memory_tournament_agent_knowledge (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    agent_id bigint NOT NULL,
    uploader_user_id integer,
    title text,
    file_url text,
    mime_type text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.memory_tournament_agent_knowledge ADD CONSTRAINT memory_tournament_agent_knowledge_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournament_agent_knowledge_agent_id ON public.memory_tournament_agent_knowledge USING btree (agent_id);
ALTER TABLE ONLY public.memory_tournament_agent_knowledge ADD CONSTRAINT memory_tournament_agent_knowledge_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.memory_tournament_agents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.memory_tournament_agent_knowledge ADD CONSTRAINT memory_tournament_agent_knowledge_uploader_user_id_fkey FOREIGN KEY (uploader_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: memory_tournaments
-- ============================================================
CREATE TABLE public.memory_tournaments (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    created_by_user_id integer,
    title text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT memory_tournaments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'running'::text, 'complete'::text])))
);

ALTER TABLE ONLY public.memory_tournaments ADD CONSTRAINT memory_tournaments_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournaments_created_by_user_id ON public.memory_tournaments USING btree (created_by_user_id);
ALTER TABLE ONLY public.memory_tournaments ADD CONSTRAINT memory_tournaments_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: memory_tournament_questions
-- ============================================================
CREATE TABLE public.memory_tournament_questions (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    tournament_id bigint NOT NULL,
    prompt text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.memory_tournament_questions ADD CONSTRAINT memory_tournament_questions_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournament_questions_tournament_id ON public.memory_tournament_questions USING btree (tournament_id);
ALTER TABLE ONLY public.memory_tournament_questions ADD CONSTRAINT memory_tournament_questions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.memory_tournaments(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: memory_tournament_matches
-- ============================================================
CREATE TABLE public.memory_tournament_matches (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    tournament_id bigint NOT NULL,
    question_id bigint,
    agent_a_id bigint,
    agent_b_id bigint,
    judge_endpoint text DEFAULT '/integrations/chat-gpt/conversationgpt4'::text NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    agent_a_response text,
    agent_b_response text,
    judge_winner text,
    judge_reasoning text,
    verdict_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    memory_entry_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp without time zone,
    CONSTRAINT memory_tournament_matches_status_check CHECK ((status = ANY (ARRAY['running'::text, 'completed'::text, 'error'::text]))),
    CONSTRAINT memory_tournament_matches_winner_check CHECK (((judge_winner IS NULL) OR (judge_winner = ANY (ARRAY['A'::text, 'B'::text, 'tie'::text]))))
);

ALTER TABLE ONLY public.memory_tournament_matches ADD CONSTRAINT memory_tournament_matches_pkey PRIMARY KEY (id);
CREATE INDEX idx_memory_tournament_matches_created_at ON public.memory_tournament_matches USING btree (created_at DESC);
CREATE INDEX idx_memory_tournament_matches_tournament_id ON public.memory_tournament_matches USING btree (tournament_id);
ALTER TABLE ONLY public.memory_tournament_matches ADD CONSTRAINT memory_tournament_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.memory_tournaments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.memory_tournament_matches ADD CONSTRAINT memory_tournament_matches_agent_a_id_fkey FOREIGN KEY (agent_a_id) REFERENCES public.memory_tournament_agents(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.memory_tournament_matches ADD CONSTRAINT memory_tournament_matches_agent_b_id_fkey FOREIGN KEY (agent_b_id) REFERENCES public.memory_tournament_agents(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.memory_tournament_matches ADD CONSTRAINT memory_tournament_matches_memory_entry_id_fkey FOREIGN KEY (memory_entry_id) REFERENCES public.memory_entries(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.memory_tournament_matches ADD CONSTRAINT memory_tournament_matches_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.memory_tournament_questions(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: pattern_requests
-- ============================================================
CREATE TABLE public.pattern_requests (
    id integer NOT NULL,
    requesting_app_id integer,
    pattern_need character varying(255) NOT NULL,
    context text,
    urgency_level character varying(20) DEFAULT 'normal'::character varying,
    responses_found integer DEFAULT 0,
    status character varying(50) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at timestamp without time zone,
    CONSTRAINT pattern_requests_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'fulfilled'::character varying, 'timeout'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT pattern_requests_urgency_level_check CHECK (((urgency_level)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))
);

CREATE SEQUENCE public.pattern_requests_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.pattern_requests_id_seq OWNED BY public.pattern_requests.id;
ALTER TABLE ONLY public.pattern_requests ALTER COLUMN id SET DEFAULT nextval('public.pattern_requests_id_seq'::regclass);
ALTER TABLE ONLY public.pattern_requests ADD CONSTRAINT pattern_requests_pkey PRIMARY KEY (id);
CREATE INDEX idx_pattern_requests_app ON public.pattern_requests USING btree (requesting_app_id);
CREATE INDEX idx_pattern_requests_status ON public.pattern_requests USING btree (status);
CREATE INDEX idx_pattern_requests_urgency ON public.pattern_requests USING btree (urgency_level);
ALTER TABLE ONLY public.pattern_requests ADD CONSTRAINT pattern_requests_requesting_app_id_fkey FOREIGN KEY (requesting_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: query_patterns
-- ============================================================
CREATE TABLE public.query_patterns (
    id integer NOT NULL,
    query_intent character varying(255) NOT NULL,
    navigation_path integer[],
    success_metric integer,
    optimization_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT query_patterns_success_metric_check CHECK (((success_metric >= 1) AND (success_metric <= 10)))
);

CREATE SEQUENCE public.query_patterns_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.query_patterns_id_seq OWNED BY public.query_patterns.id;
ALTER TABLE ONLY public.query_patterns ALTER COLUMN id SET DEFAULT nextval('public.query_patterns_id_seq'::regclass);
ALTER TABLE ONLY public.query_patterns ADD CONSTRAINT query_patterns_pkey PRIMARY KEY (id);
CREATE INDEX idx_query_patterns_intent ON public.query_patterns USING btree (query_intent);

-- ============================================================
-- TABLE: revenue_categories
-- ============================================================
CREATE TABLE public.revenue_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    app_id integer,
    category_type character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.revenue_categories_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.revenue_categories_id_seq OWNED BY public.revenue_categories.id;
ALTER TABLE ONLY public.revenue_categories ALTER COLUMN id SET DEFAULT nextval('public.revenue_categories_id_seq'::regclass);
ALTER TABLE ONLY public.revenue_categories ADD CONSTRAINT revenue_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.revenue_categories ADD CONSTRAINT revenue_categories_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.apps(id);

-- ============================================================
-- TABLE: shared_learnings
-- ============================================================
CREATE TABLE public.shared_learnings (
    id integer NOT NULL,
    source_app_id integer,
    memory_entry_id integer,
    learning_type character varying(100) NOT NULL,
    confidence_level numeric(3,2),
    replicability_score numeric(3,2),
    domain_applicability text[],
    usage_count integer DEFAULT 0,
    success_rate numeric(3,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_accessed timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shared_learnings_confidence_level_check CHECK (((confidence_level >= (0)::numeric) AND (confidence_level <= (1)::numeric))),
    CONSTRAINT shared_learnings_replicability_score_check CHECK (((replicability_score >= (0)::numeric) AND (replicability_score <= (1)::numeric)))
);

CREATE SEQUENCE public.shared_learnings_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.shared_learnings_id_seq OWNED BY public.shared_learnings.id;
ALTER TABLE ONLY public.shared_learnings ALTER COLUMN id SET DEFAULT nextval('public.shared_learnings_id_seq'::regclass);
ALTER TABLE ONLY public.shared_learnings ADD CONSTRAINT shared_learnings_pkey PRIMARY KEY (id);
CREATE INDEX idx_shared_learnings_app ON public.shared_learnings USING btree (source_app_id);
CREATE INDEX idx_shared_learnings_confidence ON public.shared_learnings USING btree (confidence_level);
CREATE INDEX idx_shared_learnings_type ON public.shared_learnings USING btree (learning_type);
ALTER TABLE ONLY public.shared_learnings ADD CONSTRAINT shared_learnings_memory_entry_id_fkey FOREIGN KEY (memory_entry_id) REFERENCES public.memory_entries(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.shared_learnings ADD CONSTRAINT shared_learnings_source_app_id_fkey FOREIGN KEY (source_app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

-- ============================================================
-- TABLE: stripe_events
-- ============================================================
CREATE TABLE public.stripe_events (
    id integer NOT NULL,
    stripe_event_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    processed boolean DEFAULT false,
    processing_error text,
    event_data jsonb,
    related_transaction_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone
);

CREATE SEQUENCE public.stripe_events_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.