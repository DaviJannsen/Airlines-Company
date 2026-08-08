package com.airlines.company.database.repository;

import com.airlines.company.database.model.Comissario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IComissarioRepository extends JpaRepository<Comissario, Integer> {
}
