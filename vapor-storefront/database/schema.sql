--
-- PostgreSQL database dump
--

\restrict BmViOlJvXmfEinbLKNG9xXxdxscScYU3ZTEXMVZR2SHntWRGA54AoijmLpBxH54

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-21 01:26:43

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

--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16568)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    cart_item_id integer NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16567)
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_cart_item_id_seq OWNER TO postgres;

--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 225
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_cart_item_id_seq OWNED BY public.cart_items.cart_item_id;


--
-- TOC entry 220 (class 1259 OID 16440)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    display_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    password_hash text
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16504)
-- Name: entitlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entitlements (
    entitlement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    order_item_id uuid,
    granted_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.entitlements OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16482)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    order_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    price_at_purchase numeric(10,2)
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16465)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    order_date timestamp without time zone DEFAULT now(),
    status character varying(30) DEFAULT 'completed'::character varying NOT NULL,
    total_amount numeric(10,2) NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16452)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    is_dlc boolean DEFAULT false NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 4925 (class 2604 OID 16571)
-- Name: cart_items cart_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_items_cart_item_id_seq'::regclass);


--
-- TOC entry 5106 (class 0 OID 16568)
-- Dependencies: 226
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (cart_item_id, customer_id, product_id, quantity) FROM stdin;
\.


--
-- TOC entry 5100 (class 0 OID 16440)
-- Dependencies: 220
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (customer_id, email, display_name, created_at, password_hash) FROM stdin;
8a80d3cf-f256-4114-8791-8709d835566e	test@example.com	TestUser	2026-04-20 01:44:14.829879	\N
3081748b-6406-4767-a353-28e18ccdf2de	test2@example.com	TestUser2	2026-04-20 02:50:16.247879	$2b$10$/jCbzK6o1O1oNtQD/hWrTOqxOqfN9gMsmv34XLDHOZZXTNRJF4zkS
892c4075-c1a8-4b9c-8070-51c392709bc7	test3@example.com	TestUser3	2026-04-20 17:40:47.662433	$2b$10$Kbci/toRQ.A//MCyvyoVbOjHk8ei5reg.Fi7s0rXmKjhqNHAZUtoi
\.


--
-- TOC entry 5104 (class 0 OID 16504)
-- Dependencies: 224
-- Data for Name: entitlements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entitlements (entitlement_id, customer_id, product_id, order_item_id, granted_at) FROM stdin;
2fa8a607-cabe-4134-b726-35b6519a7567	8a80d3cf-f256-4114-8791-8709d835566e	e8a36894-c766-43e3-bfce-22c2e3caa5aa	1bef2e1e-3281-4836-a63a-217869cafbcb	2026-04-20 01:48:56.539563
7f4eb267-ada3-4577-b0ab-8a308e03372b	8a80d3cf-f256-4114-8791-8709d835566e	5d3072db-22a7-4458-b2a0-5f7e4baf11e7	1830a6fa-76f5-4cf8-8d26-07b0c113906e	2026-04-20 01:48:56.539563
73822fc0-32ff-43d7-8064-ebf567ebd0d6	3081748b-6406-4767-a353-28e18ccdf2de	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	\N	2026-04-20 17:00:59.854324
b6d327df-be23-4119-a398-0c93c30d067e	892c4075-c1a8-4b9c-8070-51c392709bc7	5d3072db-22a7-4458-b2a0-5f7e4baf11e7	\N	2026-04-20 17:41:43.780753
5fec8a84-500a-422c-aff2-ec407349d07d	892c4075-c1a8-4b9c-8070-51c392709bc7	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	\N	2026-04-20 17:41:50.261885
d37f968b-f124-4afc-9e75-2da0b04ab18e	892c4075-c1a8-4b9c-8070-51c392709bc7	52e98e11-2db5-48bf-b4e3-ff9e01991bd0	\N	2026-04-20 17:54:23.844379
9f0b6f1f-8549-4485-ada7-6fb96699583a	892c4075-c1a8-4b9c-8070-51c392709bc7	7613c361-b765-410c-af59-dc74c15c5ccb	\N	2026-04-20 18:14:50.706514
\.


--
-- TOC entry 5103 (class 0 OID 16482)
-- Dependencies: 223
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (order_item_id, order_id, product_id, quantity, unit_price, price_at_purchase) FROM stdin;
1bef2e1e-3281-4836-a63a-217869cafbcb	2a9a48ba-9a4b-4e1a-877c-8ef3da587612	e8a36894-c766-43e3-bfce-22c2e3caa5aa	1	19.99	\N
1830a6fa-76f5-4cf8-8d26-07b0c113906e	2a9a48ba-9a4b-4e1a-877c-8ef3da587612	5d3072db-22a7-4458-b2a0-5f7e4baf11e7	1	9.99	\N
e25b1cc4-1165-4a5e-aa8f-1e6f9f873023	eb305986-4ae0-4441-b37d-44db5a93724e	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	1	59.99	\N
8d34d3ba-d6ed-46c3-86de-2a61c8c7735e	565ccf16-f319-4d52-8a87-fe2c2d87aec7	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	1	59.99	59.99
f7b5f9d0-81f6-474b-852a-733b59223764	107abd19-eaff-421c-b34f-3821b699500e	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	1	59.99	59.99
44949a30-10e1-47e1-bd90-c5c5ba558448	93049df5-842b-4780-8774-8f5ab07ce1a9	5d3072db-22a7-4458-b2a0-5f7e4baf11e7	1	9.99	9.99
892b7870-a055-4e55-ab0a-a8fd40c9e8cb	3375b633-65b3-4a25-bc13-da25afa399aa	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	1	59.99	59.99
53f8f878-f756-4736-9177-85dd3fee2481	436908da-3472-4d57-b3e7-410b21406653	52e98e11-2db5-48bf-b4e3-ff9e01991bd0	1	4.99	4.99
1993fcd8-82fc-42a0-8e29-7cd0ca8c8c72	ccfddebb-4e85-4293-a63a-046f138489f5	5d3072db-22a7-4458-b2a0-5f7e4baf11e7	1	9.99	9.99
76d9e763-74ba-4c95-9d87-aaaa320f45f5	5d7a124d-157d-46b9-86c9-1f0008e31a31	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	1	59.99	59.99
1df7f121-6bfd-4671-b139-64aca5b1cab8	9350c27e-43e7-424b-8f18-05f32be7affb	7613c361-b765-410c-af59-dc74c15c5ccb	1	69.99	69.99
312ed4e3-4a7b-43fc-82b2-d4f7152aaa7a	216ded81-46dc-4174-9747-8bf7ccc88b0c	ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	1	59.99	59.99
9447f1a6-e1ec-4b04-94dd-c6a74ef09856	20a81718-38db-4f8d-9678-2f6332fbe0b1	5d3072db-22a7-4458-b2a0-5f7e4baf11e7	1	9.99	9.99
\.


--
-- TOC entry 5102 (class 0 OID 16465)
-- Dependencies: 222
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, customer_id, order_date, status, total_amount) FROM stdin;
2a9a48ba-9a4b-4e1a-877c-8ef3da587612	8a80d3cf-f256-4114-8791-8709d835566e	2026-04-20 01:44:53.299432	completed	29.98
007c33fb-f808-41ed-8e09-5cd4345cd18d	3081748b-6406-4767-a353-28e18ccdf2de	2026-04-20 16:24:48.733873	completed	59.99
5a17d07f-4bb8-4f29-bf3f-fddc55e3411f	3081748b-6406-4767-a353-28e18ccdf2de	2026-04-20 16:25:03.398709	completed	59.99
63e1eaaa-5620-4631-a8cb-2fbdcc6e6f3c	3081748b-6406-4767-a353-28e18ccdf2de	2026-04-20 16:29:49.005554	completed	59.99
eb305986-4ae0-4441-b37d-44db5a93724e	3081748b-6406-4767-a353-28e18ccdf2de	2026-04-20 16:49:42.6771	completed	59.99
565ccf16-f319-4d52-8a87-fe2c2d87aec7	3081748b-6406-4767-a353-28e18ccdf2de	2026-04-20 16:57:43.562739	completed	59.99
107abd19-eaff-421c-b34f-3821b699500e	3081748b-6406-4767-a353-28e18ccdf2de	2026-04-20 17:00:59.849778	completed	59.99
93049df5-842b-4780-8774-8f5ab07ce1a9	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 17:41:43.777086	completed	9.99
3375b633-65b3-4a25-bc13-da25afa399aa	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 17:41:50.260192	completed	59.99
436908da-3472-4d57-b3e7-410b21406653	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 17:54:23.841202	completed	4.99
ccfddebb-4e85-4293-a63a-046f138489f5	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 18:14:22.024233	completed	9.99
5d7a124d-157d-46b9-86c9-1f0008e31a31	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 18:14:25.781638	completed	59.99
9350c27e-43e7-424b-8f18-05f32be7affb	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 18:14:50.703552	completed	69.99
216ded81-46dc-4174-9747-8bf7ccc88b0c	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 18:14:59.005992	completed	59.99
20a81718-38db-4f8d-9678-2f6332fbe0b1	892c4075-c1a8-4b9c-8070-51c392709bc7	2026-04-20 18:22:39.919637	completed	9.99
\.


--
-- TOC entry 5101 (class 0 OID 16452)
-- Dependencies: 221
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, name, description, price, is_dlc) FROM stdin;
e8a36894-c766-43e3-bfce-22c2e3caa5aa	Space Adventure	A sci‑fi exploration game	19.99	f
5d3072db-22a7-4458-b2a0-5f7e4baf11e7	Dungeon Crawler	A classic roguelike	9.99	f
52e98e11-2db5-48bf-b4e3-ff9e01991bd0	Soundtrack Pack	OST DLC	4.99	f
ac6e1baa-45bc-4ea3-93e3-7988af1b37b8	The Legend of Greg: Twilight Handball	A dark, atmospheric Brooklyn adventure.	59.99	f
7613c361-b765-410c-af59-dc74c15c5ccb	The Legend of Greg: Breath of the Subway	Open-world exploration and freedom.	69.99	f
42654c86-94be-43cd-8d06-5a07b5ee43b1	The Legend of Greg: Chopped Cheeze of Time	A dated knockoff that insults 3D adventure.	49.99	f
\.


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 225
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_cart_item_id_seq', 1, false);


--
-- TOC entry 4942 (class 2606 OID 16580)
-- Name: cart_items cart_items_customer_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_customer_id_product_id_key UNIQUE (customer_id, product_id);


--
-- TOC entry 4944 (class 2606 OID 16578)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);


--
-- TOC entry 4928 (class 2606 OID 16451)
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- TOC entry 4930 (class 2606 OID 16449)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- TOC entry 4938 (class 2606 OID 16516)
-- Name: entitlements entitlements_customer_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_customer_id_product_id_key UNIQUE (customer_id, product_id);


--
-- TOC entry 4940 (class 2606 OID 16514)
-- Name: entitlements entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_pkey PRIMARY KEY (entitlement_id);


--
-- TOC entry 4936 (class 2606 OID 16493)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- TOC entry 4934 (class 2606 OID 16476)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4932 (class 2606 OID 16464)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4951 (class 2606 OID 16581)
-- Name: cart_items cart_items_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- TOC entry 4952 (class 2606 OID 16586)
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 4948 (class 2606 OID 16517)
-- Name: entitlements entitlements_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- TOC entry 4949 (class 2606 OID 16527)
-- Name: entitlements entitlements_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id);


--
-- TOC entry 4950 (class 2606 OID 16522)
-- Name: entitlements entitlements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 4946 (class 2606 OID 16494)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- TOC entry 4947 (class 2606 OID 16499)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- TOC entry 4945 (class 2606 OID 16477)
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


-- Completed on 2026-04-21 01:26:43

--
-- PostgreSQL database dump complete
--

\unrestrict BmViOlJvXmfEinbLKNG9xXxdxscScYU3ZTEXMVZR2SHntWRGA54AoijmLpBxH54

