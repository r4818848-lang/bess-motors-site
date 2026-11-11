import { spawn, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = process.env.PGHOST ?? "";
if (host && host !== "127.0.0.1" && host !== "localhost" && host !== "/var/run/postgresql") {
  throw new Error("seo_case_sql_test_refuses_remote_host");
}

const database = `bess_seo_case_${process.pid}`;
if (!/^bess_seo_case_[0-9]+$/.test(database)) throw new Error("unsafe_test_database_name");

const peer = spawnSync("sudo", ["-u", "postgres", "psql", "-d", "postgres", "-c", "select 1"], { stdio: "ignore" }).status === 0;

function commandEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    NODE_ENV: process.env.NODE_ENV,
  };
  if (!peer) {
    env.PGHOST = "127.0.0.1";
    env.PGUSER = "postgres";
    env.PGPASSWORD = process.env.PGPASSWORD ?? "postgres";
    env.PGPORT = process.env.PGPORT ?? "5432";
  }
  return env;
}

function psqlArgs(extra: string[]): { command: string; args: string[] } {
  if (peer) return { command: "sudo", args: ["-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", ...extra] };
  return { command: "psql", args: ["-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-U", "postgres", ...extra] };
}

function run(extra: string[]): string {
  const { command, args } = psqlArgs(extra);
  const result = spawnSync(command, args, { encoding: "utf8", env: commandEnv() });
  if (result.status !== 0) {
    throw new Error(`${result.stderr ?? ""}\n${result.stdout ?? ""}`.replace(/postgres:\S+/g, "postgres").trim() || "psql_failed");
  }
  return result.stdout ?? "";
}

function query(sql: string): string {
  const output = run(["-d", database, "-t", "-A", "-c", sql]).trim();
  const json = output.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("{")).at(-1);
  return json ?? output.split("\n").at(-1)?.trim() ?? "";
}

function queryAsync(sql: string): Promise<string> {
  const { command, args } = psqlArgs(["-d", database, "-t", "-A", "-c", sql]);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: commandEnv() });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.replace(/postgres:\S+/g, "postgres").trim() || "psql_failed"));
        return;
      }
      const output = stdout.trim();
      const json = output.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("{")).at(-1);
      resolve(json ?? output.split("\n").at(-1)?.trim() ?? "");
    });
  });
}

async function main(): Promise<void> {
  const scratch = mkdtempSync(join(tmpdir(), "bess-seo-case-"));
  chmodSync(scratch, 0o755);
  try {
    copyFileSync("supabase/tests/seo-case-harness.sql", join(scratch, "harness.sql"));
    copyFileSync("supabase/migrations/20261111190000_seo_case_private_storage.sql", join(scratch, "migration.sql"));
    copyFileSync("supabase/tests/seo-case-security.sql", join(scratch, "security.sql"));
    for (const name of ["harness.sql", "migration.sql", "security.sql"]) chmodSync(join(scratch, name), 0o644);

    run(["-d", "postgres", "-c", "drop role if exists anon; drop role if exists authenticated; drop role if exists service_role;"]);
    run(["-d", "postgres", "-c", `create database ${database}`]);
    run(["-d", database, "-f", join(scratch, "harness.sql")]);
    run(["-d", database, "-f", join(scratch, "migration.sql")]);
    run(["-d", database, "-f", join(scratch, "security.sql")]);

    const created = JSON.parse(
      query(`set role service_role; select public.seo_case_apply(
        'create',
        '{"make":"Audi","model":"A6","problemPl":"Stuk","diagnosisPl":"Wahacz","workPl":"Wymiana","serviceId":"suspension"}'::jsonb,
        null,
        'idem-race-0001'
      );`)
    ) as { ok: boolean; story: { id: string; version: number } };
    if (!created.ok) throw new Error("race_case_was_not_created");

    const updateSql = `set role service_role; select public.seo_case_apply(
      'update',
      jsonb_build_object('id', '${created.story.id}', 'notesPl', 'edit'),
      ${created.story.version},
      null
    );`;
    const results = await Promise.all([queryAsync(updateSql), queryAsync(updateSql)]);
    const parsed = results.map((row) => JSON.parse(row) as { ok: boolean; error?: string });
    const wins = parsed.filter((row) => row.ok).length;
    const conflicts = parsed.filter((row) => row.error === "conflict").length;
    if (wins !== 1 || conflicts !== 1) {
      throw new Error(`parallel_update_failed wins=${wins} conflicts=${conflicts}`);
    }
    if (query("set role service_role; select count(*) from seo.cases;") !== "2") {
      throw new Error("parallel_update_lost_a_case");
    }
    if (query("select count(*) from public.crm_store;") !== "1" || query("select count(*) from public.appointments;") !== "1") {
      throw new Error("local_sentinel_rows_changed");
    }
    console.log("seo case sql ok");
  } finally {
    try {
      run(["-d", "postgres", "-c", `drop database if exists ${database}`]);
      run(["-d", "postgres", "-c", "drop role if exists anon; drop role if exists authenticated; drop role if exists service_role;"]);
    } catch {
      // A failed drop of this disposable local database must not replace the test error.
    }
    rmSync(scratch, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "seo_case_sql_failed");
  process.exit(1);
});
