package com.airlines.company.database.repository;

import com.airlines.company.database.model.Piloto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IPilotoRepository extends JpaRepository<Piloto, Integer> {
}
