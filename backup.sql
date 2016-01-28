--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: cortem; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE cortem (
    id integer NOT NULL,
    ultima_venta character(8),
    u_vol character(12),
    u_vol_2 character(12),
    u_vol_3 character(12)
);


ALTER TABLE public.cortem OWNER TO postgres;

--
-- Name: cortem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE cortem_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cortem_id_seq OWNER TO postgres;

--
-- Name: cortem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE cortem_id_seq OWNED BY cortem.id;


--
-- Name: cortep; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE cortep (
    id integer NOT NULL,
    ultima_venta character(8),
    u_vol character(12),
    u_vol_2 character(12),
    u_vol_3 character(12)
);


ALTER TABLE public.cortep OWNER TO postgres;

--
-- Name: cortep_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE cortep_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cortep_id_seq OWNER TO postgres;

--
-- Name: cortep_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE cortep_id_seq OWNED BY cortep.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE productos (
    diesel integer,
    corriente integer,
    extra integer,
    s_diesel integer
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- Name: recibo; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE recibo (
    linea1 character varying(30),
    linea2 character varying(80),
    nit character varying(12),
    tel character varying(12),
    dir character varying(30),
    footer character varying(30)
);


ALTER TABLE public.recibo OWNER TO postgres;

--
-- Name: venta; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE venta (
    autorizacion character varying(38),
    id_venta character varying(8),
    id_estacion character varying(4),
    serial character varying(16),
    km character varying(10),
    cara character(1),
    producto character(1),
    precio character varying(5),
    dinero character varying(7),
    volumen character varying(7),
    fecha character varying(20),
    enviada boolean DEFAULT false,
    id integer NOT NULL
);


ALTER TABLE public.venta OWNER TO postgres;

--
-- Name: venta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.venta_id_seq OWNER TO postgres;

--
-- Name: venta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE venta_id_seq OWNED BY venta.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cortem ALTER COLUMN id SET DEFAULT nextval('cortem_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cortep ALTER COLUMN id SET DEFAULT nextval('cortep_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY venta ALTER COLUMN id SET DEFAULT nextval('venta_id_seq'::regclass);


--
-- Name: cortem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY cortem
    ADD CONSTRAINT cortem_pkey PRIMARY KEY (id);


--
-- Name: cortep_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY cortep
    ADD CONSTRAINT cortep_pkey PRIMARY KEY (id);


--
-- Name: venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;


--
-- PostgreSQL database dump complete
--

