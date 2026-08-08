package com.airlines.company.database.repository;

import com.airlines.company.database.model.Idioma;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IIdiomaRepository extends JpaRepository<Idioma, Integer> {

    List<Idioma> findAllByOrderByNomeAsc();
}
