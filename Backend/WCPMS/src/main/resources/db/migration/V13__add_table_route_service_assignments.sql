CREATE TABLE IF NOT EXISTS route_service_assignments (
                                           route_id INT NOT NULL,
                                           account_id INT NOT NULL,
                                           PRIMARY KEY (route_id, account_id),
                                           CONSTRAINT fk_assignment_route
                                               FOREIGN KEY (route_id) REFERENCES reading_routes (id),
                                           CONSTRAINT fk_assignment_account
                                               FOREIGN KEY (account_id) REFERENCES accounts (id)
);