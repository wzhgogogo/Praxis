# B1 before-Live checks — NOT RUN

- [ ] With separate authorization for a dedicated test PostgreSQL database, verify simultaneous prompt claims over multiple independent connections/processes: at most one per Case; duplicate answers idempotent, USER_REPORTED only, Task/Outcome unchanged. Current evidence is PGlite only. Do not use production/user data or load.env for this integration task.
- [ ] At first separately authorized Live the user opens a TableCheck link in their own browser, with num_people and start_time=19%3A00, and reports whether actual date/time/guests were carried in, including an existing source session. No Praxis booking-page verification/navigation, login/fill/card/submit is authorized here.
- [ ] Known accepted behavior: after visiting outlet A then B in the same Case, there is no second feedback question. This implements the approved once-per-Case rule; reconsider only in3c with user approval.

B1 source-link activation waits for B's reviewed G3 main integration. Neither PostgreSQL smoke nor Live is executed in this batch.
